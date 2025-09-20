import { BaseConstants } from './../src/base/base.const';
/* eslint-disable @typescript-eslint/no-var-requires */
const { BaseApi } = require('../src/base/base')
const { ApiKeyNotFound, RateLimitError, ServiceUnavailable } = require('../src/errors')
import { ResponseError } from '../src/errors/response.error'
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from '../src/errors/response.error';

describe('Base api', () => {
  const riot = new BaseApi({ key: '' })
  const region = 'LA1'
  const key = 'apikey'

  describe('Arguments', () => {
    it('should throw when missing Riot api key', async () => {
      try {
        await riot.request(region)
      } catch (e) {
        expect(e).toBeInstanceOf(ApiKeyNotFound)
      }
    })

    it('should return correct key when param is an string', () => {
      const api = new BaseApi(key)
      expect(api.key).toEqual(key)
    })

    it('should return correct key when param is an object', () => {
      const api = new BaseApi({ key })
      expect(api.key).toEqual(key)
    })

    it('should return correct retry limit value', () => {
      const api = new BaseApi({ rateLimitRetry: false })
      expect(api.rateLimitRetry).toEqual(false)
    })

    it('should return correct retry limit attempts value', () => {
      const api = new BaseApi({ rateLimitRetryAttempts: 2 })
      expect(api.rateLimitRetryAttempts).toEqual(2)
    })

    it('should return valid default param', () => {
      const api = new BaseApi(key)
      const exp = {
        concurrency: undefined,
        key,
        baseURL: BaseConstants.BASE_URL,
        rateLimitRetry: true,
        rateLimitRetryAttempts: 1,
        debug: {
          logRatelimits: false,
          logTime: false,
          logUrls: false
        }
      }
      expect(api.getParam()).toEqual(exp)
    })

    it('should return new base path if set', () => {
      const newBaseURL = "${region}/:game"
      const api = new BaseApi({
        key: key,
        baseURL: newBaseURL
      });

      expect(api.getParam().baseURL).toBe(newBaseURL)
    })
  })

  const testData = "testData"
  const testHeaders = new Headers()

  describe('Service unavailable response', () => {
    it('should return valid response at 2nd attempt', async () => {
      const api: any = new BaseApi({ key: key, rateLimitRetryAttempts: 2 })
      api.internalRequest = jest.fn()
        .mockImplementationOnce(() => {
          throw new ResponseError("Nope.", SERVICE_UNAVAILABLE, undefined, testHeaders)
        })
        .mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(testData), { headers: testHeaders })))
      const response = await api.request('KR', {})
      expect(response.response).toEqual(testData)
    })

    it('should throw service unavailable error at 3rd attempt', async () => {
      const api = new BaseApi({ key: key, rateLimitRetryAttempts: 3 })
      api.internalRequest = jest.fn()
        .mockImplementation(() => {
          throw new ResponseError("Nope.", SERVICE_UNAVAILABLE, undefined, testHeaders)
        })
      try {
        await api.request('KR', {})
        throw new Error("request should have failed")
      } catch (e) {
        expect(e).toBeInstanceOf(ServiceUnavailable)
      }
    }, 10000)
  })

  describe('Rate limit response', () => {
    it('should return valid response at 2nd attempt', async () => {
      const api = new BaseApi({ key: key, rateLimitRetryAttempts: 1 })
      api.internalRequest = jest.fn()
        .mockImplementationOnce(() => {
          throw new ResponseError("Nope.", TOO_MANY_REQUESTS, undefined, testHeaders)
        })
        .mockImplementationOnce(() => Promise.resolve(new Response(JSON.stringify(testData), { headers: testHeaders })))
      const response = await api.request('KR', {})
      expect(response.response).toEqual(testData)
    })

    it('should throw rate limit error at 3rd attempt', async () => {
      const api = new BaseApi({ key: key, rateLimitRetryAttempts: 2 })
      api.internalRequest = jest.fn()
        .mockImplementation(() => {
          throw new ResponseError("Nope.", TOO_MANY_REQUESTS, undefined, testHeaders)
        })
      try {
        await api.request('KR', {})
      } catch (e) {
        expect(e).toBeInstanceOf(RateLimitError)
      }
    })

    it('should throw rate limit when option ins disable', async () => {
      const api = new BaseApi({
        key,
        rateLimitRetry: false,
        rateLimitRetryAttempts: 1
      })
      api.internalRequest = jest.fn()
        .mockImplementationOnce(() => {
          throw new ResponseError("Nope.", TOO_MANY_REQUESTS, undefined, testHeaders)
        })
      try {
        await api.request('KR', {})
      } catch (e) {
        expect(e).toBeInstanceOf(RateLimitError)
      }
    })

    it('should throw rate limit when retry limit retry attempts is lower than 1', async () => {
      const api = new BaseApi({
        key,
        rateLimitRetry: true,
        rateLimitRetryAttempts: 0
      })
      api.internalRequest = jest.fn()
        .mockImplementationOnce(() => {
          throw new ResponseError("Nope.", TOO_MANY_REQUESTS, undefined, testHeaders)
        })
      try {
        await api.request('KR', {})
      } catch (e) {
        expect(e).toBeInstanceOf(RateLimitError)
      }
    })
  })
})
