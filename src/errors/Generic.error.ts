import { IErrors } from '.'
import { RateLimitDto } from '../models-dto/rate-limit/rate-limit.dto'
import { INTERNAL_SERVER_ERROR } from '../../src/errors/response.error';
import { FetchError } from './fetch.error'
import { ResponseError } from './response.error'

const message = 'Generic error'

export class GenericError extends Error implements IErrors {
  readonly status: number
  readonly error: Error
  readonly rateLimits: RateLimitDto
  readonly body?: any
  readonly name = 'GenericError'

  // NOTE This default value is not ideal because it indicates an HTTP server has been reached, 
  // which could be wrong (if the network is down for instance). 
  // Probably a non-existent HttpStatusCodes code should have been used instead, but changing it 
  // may impact client libraries that rely on it so I'm not touching it.
  public static readonly UNDEFINED_STATUS: number = INTERNAL_SERVER_ERROR

  constructor(rateLimits: RateLimitDto, e: FetchError | ResponseError) {
    super(e.message || message)
    this.status = (e as any).status ??= GenericError.UNDEFINED_STATUS
    this.body = (e as any).body || (e as any).data
    // NOTE .rateLimits should be allowed to be undefined or null 
    // if no rate limit is available (see the NOTE about .status)
    // because an error could occur before HTTP headers are retrieved from the server
    this.rateLimits = rateLimits
    this.error = e
    Object.setPrototypeOf(this, GenericError.prototype)
  }
}
