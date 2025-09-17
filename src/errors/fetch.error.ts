// Exception thrown when an HTTP response could not be retrieved
// NOTE This class does not implement IErrors because the status and headers could be undefined
// example : if the network or the server is down and no headers and status could be retrieved
// See https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch

export class FetchError extends Error {
  public readonly error?: Error;

  constructor(
    message: string,
    originalError?: Error,
  ) {
    super(message);
    this.error = originalError;
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}
