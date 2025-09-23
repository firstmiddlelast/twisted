import { NOT_IMPLEMENTED } from './response.error'
import { IErrors } from './base'

const message = 'Api key not found'

/**
 * Not api key found
 */
export class ApiKeyNotFound extends Error implements IErrors {
  readonly status = NOT_IMPLEMENTED
  readonly name = 'ApiKeyNotFound'

  // This isn't a useless constructor because this error doesn't need a message parameter
  constructor () {
    super(message)
    Object.setPrototypeOf(this, ApiKeyNotFound.prototype)
  }
}
