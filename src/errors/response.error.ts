// Exception thrown when an HTTP request could be retrieved from the Riot servers, but it's not ok to use, 
// either because of non-ok HTTP status (not in 200-299 range) or because the response caused an error
// when trying to turn it into a DTO object (i.e. reading stream interrupted, badly formed JSON...)
export class ResponseError extends Error {
  public readonly name: string = 'ResponseError'
  public readonly status: number;
  public readonly body: any;
  public readonly headers: Headers

  constructor(
    message: string,
    status: number,
    body: any,
    headers: Headers,
  ) {
    super(message);
    this.headers = headers;
    this.status = status;
    this.body = body;
    Object.setPrototypeOf(this, ResponseError.prototype);
  }
}
