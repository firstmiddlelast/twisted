import HttpStatusCodes from 'http-status-codes';
import { IErrors } from '.';
import { RateLimitDto } from '../models-dto/rate-limit/rate-limit.dto';

export class FetchError extends Error implements IErrors {
  public readonly status: number;
  public readonly error?: Error;
  public readonly rateLimits?: RateLimitDto;
  public readonly body?: any;

  public readonly response?: {
    status: number;
    data: any;
    headers: Headers;
  };
  public readonly name = 'FetchError';

  constructor(
    message: string,
    responseStatus: number,
    responseData: any,
    responseHeaders: Headers,
    originalError?: Error,
    rateLimitsDto?: RateLimitDto
  ) {
    super(message);
    Object.setPrototypeOf(this, FetchError.prototype);

    this.status = responseStatus;
    this.error = originalError;
    this.rateLimits = rateLimitsDto;
    this.body = responseData;

    this.response = {
      status: responseStatus,
      data: responseData,
      headers: responseHeaders,
    };
  }
}
