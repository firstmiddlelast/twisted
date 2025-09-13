import { BaseApi } from '../../src/base/base';
import { GenericError, RateLimitError, ServiceUnavailable } from '../../src/errors';
import { BaseConstants } from '../../src/base/base.const';
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from 'http-status-codes';
import { IEndpoint } from '../../src/endpoints';
import { IParams } from '../../src/base/base.utils';

jest.setTimeout(10000);


class BaseApiTest extends BaseApi<any> {
  public request<T>(region: any, endpoint: IEndpoint, params?: IParams, forceError?: boolean, queryParams?: any): Promise<T> {
    return super.request(region, endpoint, params, forceError, queryParams) as Promise<T>;
  }
}

describe('BaseApi HTTP Error Handling', () => {
  let api: BaseApiTest;
  const key = 'testKey';
  const region = 'NA1';

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
    api = new BaseApiTest({ key, baseURL: 'http://localhost:8080', debug: { logUrls: true } });
  });

  it('200 OK HTTP response', async () => {
    const endpoint200 = { path: '/200', version: 1, prefix: 'lol' };
    await api.request(region, endpoint200);
  });

  it('404 Not Found HTTP response', async () => {
    const endpoint404 = { path: '/404', version: 1, prefix: 'lol' };
    try {
      await api.request(region, endpoint404);
      fail('Should have thrown an error');
    } catch (e) {
      expect(e).toBeInstanceOf(GenericError);
      const error = e as GenericError;
      expect(error.status).toBe(404);
    }
  });

  it('429 Too Many Requests HTTP response', async () => {
    const endpoint429 = { path: '/429', version: 1, prefix: 'lol' };
    try {
      await api.request(region, endpoint429);
      fail('Should have thrown an error');
    }
    catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const error = e as RateLimitError;
      expect(error.status).toBe(TOO_MANY_REQUESTS);
      expect(error.rateLimits.RetryAfter).toBe(1);
    }
  });

  it('503 Service Unavailable HTTP response', async () => {
    const endpoint503 = { path: '/503', version: 1, prefix: 'lol' };
    try {
      await api.request(region, endpoint503);
      fail('Should have thrown an error');
    }
    catch (e) {
      expect(e).toBeInstanceOf(ServiceUnavailable);
      const error = e as ServiceUnavailable;
      expect(error.status).toBe(SERVICE_UNAVAILABLE);
    }
  });

  
});