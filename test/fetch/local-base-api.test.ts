import { GenericError, RateLimitError, ServiceUnavailable } from '../../src/errors';
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from '../../src/errors/response.error';
import { LolStatusContentDTO } from "../../src/models-dto/status/status-v4"
import { BaseApi } from '../../src/base/base';
import { IEndpoint } from '../../src/endpoints';
import { ApiResponseDTO } from '../../src/models-dto/api-response/api-response';

jest.setTimeout(10000);

// Sub-class created only for making the .request() method public. 
class LocalBaseApi<T extends string> extends BaseApi<T> {
  public request<T>(region: any, endpoint: IEndpoint, params?: object | URLSearchParams): Promise<T> {
    return super.request<T>(region, endpoint, params) as Promise<T>;
  }
}

let localApi: LocalBaseApi<string>;
const key = 'testKey';
const region = 'localhost';
const requestTestParams = { division: 'woods' }

describe('BaseApi request HTTP Error Handling', () => {
  let serverProcess: any;

  beforeAll(async () => {
    const { spawn } = require('child_process');
    serverProcess = spawn('ts-node', ['http-test-server.ts'], {
      cwd: __dirname,
      stdio: 'inherit',
    });

    await new Promise(resolve => setTimeout(resolve, 7000));
  });

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGINT');
    }
  });

  beforeEach(() => {
    localApi = new LocalBaseApi({ key, baseURL: 'http://$(region):8080/$(division)', debug: { logUrls: true } });
  });


  describe('Utils : URL composition with region, paths and parameters', () => {


    it('variable substitution in URL path', async () => {
      const params = { division: 'wood' }
      const endpoint = { path: 'echo', version: 1, prefix: 'lol' }
      const apiResponse = await localApi.request<ApiResponseDTO<any>>(region, endpoint, params);
      expect((apiResponse.response.reqUrl as string)).toBe('/wood/lol/v1/echo')
      // We don't explicitly test region substitution here 
      // because it's obvious it has been correctly done if we receive this echo from localhost ($(region) in the baseURL)
    })

    it('parameters with multiple values are properly encoded in an url request and retrieved', async () => {
      // This test is a "dirty" port of the 'should return correct url with query params' test in base.test.ts
      // ...which tests things out of typescript type safety
      let endpoint = { path: 'echo', version: 1, prefix: 'lol' };
      const params = { ...requestTestParams, "param": 1 }
      let apiResponse = await localApi.request<ApiResponseDTO<string>>(region, endpoint, params);
      expect(apiResponse.response.search).toBe("?param=1")
      endpoint = { path: 'echo', version: 1, prefix: 'lol' };
      const arrayParams = { ...requestTestParams, "param": [1, 2], queue: [420, 430], beginIndex: 0, endIndex: 10 }
      apiResponse = await localApi.request<ApiResponseDTO<string>>(region, endpoint, arrayParams);
      expect(apiResponse.response.search).toBe("?param=1&param=2&queue=420&queue=430&beginIndex=0&endIndex=10")

      // TODO : tester l'encodage URI des caractères spéciaux

    })

    // This is a test for our test http server ; it checks that : 
    //  -the test api http server provides a correct api response
    //  -the rateLimits fields are correctly retrieved
    //  -the response is correctly typed and fields available - testing only AppRa
    it('status OK HTTP response content', async () => {
      const endpointStatus: IEndpoint = { path: 'status', version: 1, prefix: 'lol' };
      const apiResponse = await localApi.request<ApiResponseDTO<LolStatusContentDTO>>(region, endpointStatus, requestTestParams)
      expect(apiResponse.response.locale).toBe("en_GB")
      expect(apiResponse.response.content).toBe("Account Transfers Unavailable")
      expect(apiResponse.rateLimits?.AppRateLimit).toBe('no-limit')
    });

    // TODO For GenericErrors, check status, body?, message, rateLimits, error

    it('404 Not Found HTTP response', async () => {
      const endpoint404 = { path: '404', version: 1, prefix: 'lol' };
      try {
        await localApi.request(region, endpoint404, requestTestParams);
        fail('Should have thrown an error');
      }
      catch (e) {
        expect(e).toBeInstanceOf(GenericError);
        const error = e as GenericError;
        expect(error.status).toBe(404);
        expect(error.message).toBe("Requesting http://localhost:8080/woods/lol/v1/404 failed with status code 404");
        expect(error.name).toBe("GenericError");
      }
    });


    it('429 Too Many Requests HTTP response', async () => {
      const endpoint429 = { path: String(TOO_MANY_REQUESTS), version: 1, prefix: 'lol' };
      try {
        await localApi.request(region, endpoint429, requestTestParams);
        fail('Should have thrown an error');
      }
      catch (e) {
        expect(e).toBeInstanceOf(RateLimitError);
        const rle = e as RateLimitError;
        expect(rle.status).toBe(TOO_MANY_REQUESTS);
        // We only test for .AppRateLimit on our local test server
        // if it's ok, that means BaseApi.getRateLimits() is working properly
        // and all other rate limit headers will be properly retrieved from the live Riot API servers. 
        expect(rle.rateLimits.AppRateLimit).toBe("none");
        // TODO : test .message, .name
      }
    });

    it('429 Retry attempt delays', async () => {
      const retryAttempts = 2
      const delay = 2
      const endpoint429 = { path: String(TOO_MANY_REQUESTS), version: 1, prefix: 'lol' };
      const retryingApi = new LocalBaseApi({
        key,
        baseURL: 'http://$(region):8080/$(division)',
        debug: { logUrls: true },
        rateLimitRetryAttempts: retryAttempts
      });
      const firstAttemptTime = new Date().getTime()
      try {
        await retryingApi.request(region, endpoint429, { ...requestTestParams, 'retry-after': delay });
        fail('Should have thrown an error');
      }
      catch (e) {
        expect(e).toBeInstanceOf(RateLimitError);
        const rle = e as RateLimitError;
        expect(rle.status).toBe(TOO_MANY_REQUESTS);
        // Checks the local test server has sent back the delay that was requested in the URL request parameters
        expect(rle.rateLimits.RetryAfter).toBe(delay);
        // Checks the attempts have been done (and failed since we request the 429 endpoint) 
        // after having internally waited for the server specified delay times the parametrized api retries
        const errorTime = new Date().getTime();
        // Check the API waited before making new attempts
        expect(errorTime - firstAttemptTime).toBeGreaterThan(retryAttempts * delay * 1000)
      }
    });

    it('503 Service Unavailable HTTP response', async () => {
      const endpoint503 = { path: String(SERVICE_UNAVAILABLE), version: 1, prefix: 'lol' }
      try {
        await localApi.request(region, endpoint503, requestTestParams);
        fail('Should have thrown an error');
      }
      catch (e) {
        expect(e).toBeInstanceOf(ServiceUnavailable);
        const error = e as ServiceUnavailable;
        expect(error.status).toBe(SERVICE_UNAVAILABLE);
        // TODO : test .message, .rateLimits (why are they here?), .error
      }
    });

    // TODO Test request queue : check first long requests do not block following requests, 
    // and also check that requests start as soon as a spot is available in the queue
  });
})