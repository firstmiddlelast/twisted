import { ResponseError } from '../errors/response.error'
import { ApiKeyNotFound } from '../errors'
import { IEndpoint } from '../endpoints'
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from '../../src/errors/response.error';
import { ApiResponseDTO } from '../models-dto/api-response/api-response'
import { RateLimitDto } from '../models-dto/rate-limit/rate-limit.dto'
import { GenericError } from '../errors/Generic.error'
import { RateLimitError } from '../errors/rate-limit.error'
import { IBaseApiParams, waiter } from './base.utils'
import { ServiceUnavailable } from '../errors/service-unavailable.error'
import { BaseConstants, BaseApiGames, BASE_URL_PARAM_REPLACEMENT_REGEXP } from './base.const'
import { Logger } from './logger.base'
import { RequestBase } from './request.base'
import { RegionGroups } from '../constants'
import { FetchError } from '../errors/fetch.error'

export class BaseApi<Region extends string> {
  protected readonly game: BaseApiGames = BaseApiGames.LOL
  private baseUrl: string = BaseConstants.BASE_URL
  private readonly key: string
  private concurrency: number | undefined
  private rateLimitRetry: boolean = true
  private rateLimitRetryAttempts: number = BaseConstants.RETRY_ATTEMPTS
  private debug = {
    logTime: false,
    logUrls: false,
    logRatelimits: false
  }
  private readonly keyHeader: Headers;

  constructor()
  constructor(params: IBaseApiParams)
  /**
   * Base api
   * @param key Riot games api key
   */
  constructor(key: string)
  constructor(param?: string | IBaseApiParams) {
    if (typeof param === 'string') {
      this.key = param
    } else if (param) {
      if (typeof param.key === 'string') {
        this.key = param.key
      }
      this.setParams(param)
    }
    this.keyHeader = new Headers();
    this.keyHeader.append('X-Riot-Token', this.key)
  }

  private setParams(param: IBaseApiParams) {
    if (typeof param.rateLimitRetry !== 'undefined') {
      this.rateLimitRetry = param.rateLimitRetry
    }
    if (typeof param.rateLimitRetryAttempts !== 'undefined') {
      this.rateLimitRetryAttempts = param.rateLimitRetryAttempts
    }
    if (typeof param.debug !== 'undefined') {
      if (typeof param.debug.logTime !== 'undefined') {
        this.debug.logTime = param.debug.logTime
      }
      if (typeof param.debug.logUrls !== 'undefined') {
        this.debug.logUrls = param.debug.logUrls
      }
      if (typeof param.debug.logRatelimits !== 'undefined') {
        this.debug.logRatelimits = param.debug.logRatelimits
      }
    }
    if (typeof param.baseURL !== 'undefined') {
      this.baseUrl = param.baseURL
    }
    this.concurrency = param.concurrency
    if (typeof param.concurrency !== 'undefined') {
      RequestBase.setConcurrency(param.concurrency)
    } else {
      RequestBase.setConcurrency(Infinity)
    }
  }

  // This value only exists for code correctness. 
  // The only value actually used here is RetryAfter. 
  public static readonly DEFAULT_RATE_LIMIT_VALUE: string = "";
  public static readonly DEFAULT_RATE_LIMIT_RETRY_AFTER: number = 0;

  public static getRateLimits(headers: Headers): RateLimitDto {
    return {
      Type: headers.get('x-rate-limit-type') || undefined,
      AppRateLimit: headers.get('x-app-rate-limit') || BaseApi.DEFAULT_RATE_LIMIT_VALUE,
      AppRateLimitCount: headers.get('x-app-rate-limit-count') || BaseApi.DEFAULT_RATE_LIMIT_VALUE,
      MethodRateLimit: headers.get('x-method-rate-limit') || BaseApi.DEFAULT_RATE_LIMIT_VALUE,
      MethodRatelimitCount: headers.get('x-method-rate-limit-count') || BaseApi.DEFAULT_RATE_LIMIT_VALUE,
      RetryAfter: Number(headers.get('retry-after')) || BaseApi.DEFAULT_RATE_LIMIT_RETRY_AFTER,
      EdgeTraceId: headers.get('x-riot-edge-trace-id') || BaseApi.DEFAULT_RATE_LIMIT_VALUE
    }
  }

  // Wraps potentially unknown error types into known error types
  // errors are wrapped in RateLimiErrors and ServiceUnavailable according to status when appropriate
  // ResponseErrors and FetchErrors and any other errors are wrapped into GenericErrors
  private wrapError(e: any): RateLimitError | ServiceUnavailable | GenericError {
    console.debug("WRAPPING " + e.stack)
    if (e instanceof RateLimitError || e instanceof ServiceUnavailable
      || e instanceof GenericError) {
      console.debug('WRAPRETURNING')
      return e
    }
    console.debug("GETTINGRATELIMIT ")
    // e.headers may be undefined (FetchError during .fetch(), etc.)
    // ..so we create a new Headers() with default values for use in the GenericError constructor
    // NOTE XXX This is bad because it will give default rate limits at times when none are provided
    // ..and thus may force a wrong error response behaviour
    const rateLimits = (e.headers !== undefined) ?
      BaseApi.getRateLimits(e.headers) :
      BaseApi.getRateLimits(new Headers())
    console.debug("GOTRATELIMIT ")
    if (e.status === TOO_MANY_REQUESTS) {
      console.debug('GOING RATELIMIT')
      return new RateLimitError(rateLimits, "Too many request : " + e.message, e)
    }
    if (e.status === SERVICE_UNAVAILABLE) {
      console.debug('GOING SERVICE')
      return new ServiceUnavailable(rateLimits, e)
    }
    console.debug('GOING GENERIC')
    return new GenericError(rateLimits, e)
  }

  // Retrieves an response from an URL, expecting a JSON response
  // Handles HTTP non-ok error requests
  // Throws FetchError (can't get an answer from the endpoint) from RequestBase.request/.internalRequest
  // or ResponseError (bad response from the endpoint : HTTP not ok, invalid response format...)
  private internalRequest(request: Request): Promise<Response> {
    return RequestBase.request(request)
      .catch((e) => {
        if (e instanceof FetchError || e instanceof ResponseError)
          throw e
        console.debug("MESSAGE=" + e.message)
        // Wrap any other unknown error into a FetchError
        throw new FetchError("Request failed", e)
      })
  }

  protected getParam(): IBaseApiParams {
    return {
      key: this.key,
      rateLimitRetry: this.rateLimitRetry,
      rateLimitRetryAttempts: this.rateLimitRetryAttempts,
      concurrency: this.concurrency,
      baseURL: this.baseUrl,
      debug: this.debug
    }
  }

  // Tries to retrieve an object from Riot public API servers using the configured API key
  // Composes the URL with appropriate parameters
  // Retries according to the retry attempt configuration, API rate limiting configuration and API feedback
  // Throws RateLimitError, ServiceUnavailable, ApiKeyNotFound, 
  // or GenericError (wrapping FetchError, ResponseError, TypeError or other error appropriately)
  // TODO FIXME : pourquoi queryParams n'est-il jamais utilisé? 
  protected async request<T>(region: Region | RegionGroups, endpoint: IEndpoint,
    searchParams?: object | URLSearchParams, forceError?: boolean/*, queryParams?: any*/): Promise<ApiResponseDTO<T>> {
    if (!this.key) {
      throw new ApiKeyNotFound()
    }
    let request: Request
    let url: URL
    try {
      let urlString: string
      let requestParams: URLSearchParams;
      if (searchParams instanceof URLSearchParams) {
        requestParams = searchParams
      }
      else {
        requestParams = new URLSearchParams(Object.entries(searchParams ??= {}))
      }
      console.log('REQUEST_PARAMS=' + requestParams)
      urlString = `${this.baseUrl}/${endpoint.prefix}/v${endpoint.version}/${endpoint.path}`
      urlString
        .replace('region', region.toLocaleLowerCase())
        .replace(':game', this.game)
        .replace(BASE_URL_PARAM_REPLACEMENT_REGEXP, (match) => {
          if (requestParams.get(match[1]) === null)
            throw new TypeError("Can not complete URL " + urlString + " substitution because of null parameter " + match[1])
          // Once a parameter has been used for substitution, it should not appear in the query
          // TODO XXX CHECK IF THE ABOVE IS TRUE, 
          // i.e. if no parameter used in the api has the same name as the parameters used for substitution
          // (i.e. region, )
          //  requestParams.delete(match[1]) Temporarily disabled
          return requestParams.get(match[1])!
        })

      url = new URL(urlString)
      url.search = requestParams.toString()
      request = new Request(url.toString(), { headers: this.keyHeader, method: 'GET' });
    }
    catch (e: any) {
      e.message = "Could not prepare request : " + e.message
      if (e instanceof TypeError) {
        throw new GenericError(new RateLimitDto(), e)
      }
      else {
        throw e
      }
    }

    if (this.debug.logTime) {
      Logger.start(endpoint, url.toString())
    }
    console.log('URL=' + url)
    // "+1" on the line below because the first attempt does not count as a _REtry_ 
    // and it's _REtries_ that are specified in the parameters
    let attemptsLeft = this.rateLimitRetryAttempts + 1;
    let result: ApiResponseDTO<T> | undefined = undefined;
    let lastAttemptError = undefined;
    let rateLimits: RateLimitDto | undefined;
    while (result === undefined && attemptsLeft > 0) {
      try {
        if (this.debug.logUrls) {
          Logger.uri(request, endpoint)
        }
        console.debug('RETRYING...')
        result = await this.internalRequest(request)
          .then(async fetchResponse => {
            console.debug('FETCH RESPONSE : ' + JSON.stringify(fetchResponse))
            rateLimits = BaseApi.getRateLimits(fetchResponse.headers);
            // Throw the appropriate exceptions if the status requires additional retries
            if (fetchResponse.status === SERVICE_UNAVAILABLE) {
              throw new ServiceUnavailable(
                rateLimits,
                new ResponseError("Request failed with status code " + SERVICE_UNAVAILABLE,
                  fetchResponse.status,
                  await fetchResponse.text().catch(),
                  fetchResponse.headers
                )
              )
            }
            if (fetchResponse.status === TOO_MANY_REQUESTS) {
              throw new RateLimitError(rateLimits, "Too many requests (response status : " + TOO_MANY_REQUESTS + ")")
            }
            console.debug('FETCHING OBJECT')
            return {
              rateLimits: rateLimits,
              response: await fetchResponse.json() as T
            }
          })
          // NOTE Trace 
          .catch(e => {
            console.debug("INTERNAL_REQUEST " + e + " : " + e.message)
            throw e
          })
      }
      catch (internalRequestError: any) {
        console.debug('INTERNAL_ERROR (force=' + forceError + ")s (" + internalRequestError.status + ")" + internalRequestError)
        lastAttemptError = internalRequestError
        if (forceError ||
          (internalRequestError.status !== TOO_MANY_REQUESTS && internalRequestError.status !== SERVICE_UNAVAILABLE)) {
          throw this.wrapError(lastAttemptError)
        }
      }
      // Successful request return here
      if (result !== undefined) {
        if (this.debug.logTime) {
          Logger.end(endpoint, url.toString())
        }
        return result
      }
      else {
        if (!this.rateLimitRetry) {
          if (rateLimits === undefined) {
            // Something went wrong in internalRequest before rate limits were even made available
            throw this.wrapError(lastAttemptError)
          }
          else {
            throw new RateLimitError(rateLimits, "No result retrieved. Retrying would be possible according to the HTTP response but is not allowed by configuration")
          }
        }
        // Set a new attempt
        if (attemptsLeft > 0) {
          console.debug('WAITING..')
          attemptsLeft--;
          const waitSeconds =
            lastAttemptError.status === SERVICE_UNAVAILABLE ?
              BaseConstants.SERVICE_UNAVAILABLE :
              BaseConstants.RATE_LIMIT
          const rl = (rateLimits === undefined) ? BaseApi.DEFAULT_RATE_LIMIT_RETRY_AFTER : rateLimits.RetryAfter ??= BaseApi.DEFAULT_RATE_LIMIT_RETRY_AFTER
          const msToWait = (rl * 1000) + (waitSeconds * 1000 * Math.random())
          if (this.debug.logRatelimits) {
            Logger.rateLimit(endpoint, msToWait)
          }
          await waiter(msToWait)
          console.debug('..DONE WAITING')
        }
      }
    }
    console.debug('ALL_ATTEMPTS_FAILED : ' + lastAttemptError.stack)
    const finalError = this.wrapError(lastAttemptError)
    console.debug('WRAPPED : ' + lastAttemptError.stack)
    finalError.message = "All " + this.rateLimitRetryAttempts + " retry attemps failed. " + finalError.message
    //if (finalError !== lastAttemptError) finalError.message += " Last error : " + lastAttemptError.message
    throw finalError
  }
}
