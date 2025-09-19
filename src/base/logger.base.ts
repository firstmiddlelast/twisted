import { IEndpoint } from '../endpoints/endpoints'

export class Logger {
  // Private methods
  private static parseName(endpoint: IEndpoint, uri?: string) {
    let text = `${endpoint.prefix}/${endpoint.path}`
    if (uri) {
      text += ` (${uri})`
    }
    return text
  }
  // Public methods
  static start(endpoint: IEndpoint, uri?: string) {
    const name = Logger.parseName(endpoint, uri)
    console.time(name)
  }

  static end(endpoint: IEndpoint, uri?: string) {
    const name = Logger.parseName(endpoint, uri)
    console.timeEnd(name)
  }

  static uri(request: Request, endpoint: IEndpoint) {
    console.log(`Calling method url: ${request.url} (${endpoint.path})`)
  }

  static rateLimit(endpoint: IEndpoint, ms: number) {
    const name = Logger.parseName(endpoint)
    console.log(`Waiting ${(ms / 1000).toFixed(2)} seconds by rate limit (${name})`)
  }
}
