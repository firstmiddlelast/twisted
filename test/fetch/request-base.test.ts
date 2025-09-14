import { RequestBase } from '../../src/base/request.base';
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from 'http-status-codes';
import { AxiosError } from 'axios';

jest.setTimeout(20000); // Increased timeout for concurrency tests

describe('RequestBase Concurrency and HTTP Behavior', () => {
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

  it('executes requests concurrently when concurrency > 1', async () => {
    const delay=1000
    const numRequests = 10;
    const concurrency = 10;

    RequestBase.setConcurrency(concurrency);

    const startTime = Date.now();
    const requests = [];
    for (let i = 0; i < numRequests; i++) {
      requests.push(RequestBase.request({url:"http://localhost:8080/delay/" + delay, method:"GET"}));
    }
    await Promise.all(requests);
    const endTime = Date.now();

    const duration = endTime - startTime;

    expect(duration).toBeLessThan(delay * numRequests);
  });

  it('executes requests sequentially when concurrency === 1', async () => {
    const delay = 1000;
    const numRequests = 3;
    const concurrency = 1;

    RequestBase.setConcurrency(concurrency);

    const startTime = Date.now();
    const requests = [];
    for (let i = 0; i < numRequests; i++) {
      requests.push(RequestBase.request({url:"http://localhost:8080/delay/" + delay, method:'GET'}));
    }
    await Promise.all(requests);
    const duration = Date.now() - startTime;

    expect(duration).toBeGreaterThanOrEqual(delay * numRequests);
  });

    it('200 OK response', async () => {
      const options = {
        url: 'http://localhost:8080/200',
        method: 'GET',
      };
      await RequestBase.request(options);
    });

    it('404 Not Found response', async () => {
      const options = {
        url: 'http://localhost:8080/404',
        method: 'GET',
      };
      try {
        await RequestBase.request(options);
        fail('Should have thrown an error');
      } catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        const error = e as AxiosError;
        expect(error.status).toBe(404);
      }
    });

    it('429 Too Many Requests response', async () => {
      const options = {
        url: 'http://localhost:8080/429',
        method: 'GET',
      };
      try {
        await RequestBase.request(options);
        fail('Should have thrown an error');
      }
      catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        const error = e as AxiosError;
        expect(error.status).toBe(TOO_MANY_REQUESTS);
      }
    });

    it('503 Service Unavailable response', async () => {
      const options = {
        url: 'http://localhost:8080/503',
        method: 'GET',
      };
      try {
        await RequestBase.request(options);
        fail('Should have thrown an error');
      }
      catch (e) {
        expect(e).toBeInstanceOf(AxiosError);
        const error = e as AxiosError;
        expect(error.status).toBe(SERVICE_UNAVAILABLE);
      }
    });
  });
