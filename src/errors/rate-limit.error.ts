import { IErrors } from '.'
import { TOO_MANY_REQUESTS } from './response.error'
import { RateLimitDto } from '../models-dto/rate-limit/rate-limit.dto'

/**
 * Rate limit error
 */
export class RateLimitError extends Error implements IErrors {
  readonly status: number = TOO_MANY_REQUESTS
  readonly rateLimits: RateLimitDto
  readonly error?: any

  constructor (rateLimits: RateLimitDto, message:string, error?:any) {
    super(message)
    this.error = error
    this.rateLimits = rateLimits
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}
