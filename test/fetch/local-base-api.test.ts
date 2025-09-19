import { GenericError, RateLimitError, ServiceUnavailable } from '../../src/errors';
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from '../../src/errors/response.error';
import { LolStatusContentDTO } from "../../src/models-dto/status/status-v4"
import { BaseApi } from '../../src/base/base';
import { IEndpoint } from '../../src/endpoints';
import { ApiResponseDTO } from '../../src/models-dto/api-response/api-response';

jest.setTimeout(10000);

// Sub-class created only for making the .request() method public. 
class LocalBaseApi<T extends string> extends BaseApi<T> {
  public request<T>(region: any, endpoint: IEndpoint, params?: object | URLSearchParams, forceError?: boolean): Promise<T> {
    return super.request<T>(region, endpoint, params, forceError) as Promise<T>;
  }
}

describe('BaseApi request HTTP Error Handling', () => {
  let localApi: LocalBaseApi<string>;
  const key = 'testKey';  // TODO Utiliser des valeurs réelles
  const region = 'NA1'; // TODO Utiliser des valeurs réelles

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
    localApi = new LocalBaseApi({ key, baseURL: 'http://localhost:8080', debug: { logUrls: true } });
  });

  // TODO : with multiple headers

  it('parameters with multiple values are properly encoded in an url request and retrieved', async () => {
    // This test is a "dirty" port of the 'should return correct url with query params' test in base.test.ts
    // ...which tests things out of typescript type safety
    let endpoint = { path: 'echo', version: 1, prefix: 'lol' };
    const params = { "param": 1 }
    let apiResponse = await localApi.request<ApiResponseDTO<string>>(region, endpoint, params, undefined);
    expect(apiResponse.response.search).toBe("?param=1")
    endpoint = { path: 'echo', version: 1, prefix: 'lol' };
    const arrayParams = { "param": [1, 2] }
    apiResponse = await localApi.request<ApiResponseDTO<string>>(region, endpoint, arrayParams, undefined);
    expect(apiResponse.response.search).toBe("?param=1&param=2")
  })

  // TODO : tester l'encodage URI
  if (false)
    // This is a test for our test http server ; it checks that : 
    //  -the test api http server provides a correct api response
    //  -the rateLimits fields are correctly retrieved
    //  -the response is correctly typed and fields available - testing only AppRa
    it('status OK HTTP response content', async () => {
      const endpointStatus: IEndpoint = { path: 'status', version: 1, prefix: 'lol' };
      const apiResponse = await localApi.request<ApiResponseDTO<LolStatusContentDTO>>(region, endpointStatus)
      expect(apiResponse.response.locale).toBe("en_GB")
      expect(apiResponse.response.content).toBe("Account Transfers Unavailable")
      expect(apiResponse.rateLimits?.AppRateLimit).toBe('no-limit')
    });

  // TODO For GenericErrors, check status, body?, message, rateLimits, error
  if (false)
    it('404 Not Found HTTP response', async () => {
      const endpoint404 = { path: '404', version: 1, prefix: 'lol' };
      try {
        await localApi.request(region, endpoint404);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(GenericError);
        const error = e as GenericError;
        expect(error.status).toBe(404);
        expect(error.message).toBe("Request failed with status code 404");
        expect(error.name).toBe("GenericError");
      }
    });

  if (false)
    it('429 Too Many Requests HTTP response', async () => {
      const endpoint429 = { path: String(TOO_MANY_REQUESTS), version: 1, prefix: 'lol' };
      try {
        await localApi.request(region, endpoint429);
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
  if (false)
    it('503 Service Unavailable HTTP response', async () => {
      try {
        await localApi.request(region,
          { path: String(SERVICE_UNAVAILABLE), version: 1, prefix: 'lol' }
        );
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