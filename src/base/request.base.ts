import PromiseQueue from 'promise-queue'
import { FetchRequestConfig } from './fetch-request-config'
import { FetchError } from '../errors/fetch.error';
import { ResponseError } from '../errors/response.error';

export class RequestBase {
  static queue: PromiseQueue

  // Throws FetchError if something goes wrong when awaited
  private static async sendRequest (options: FetchRequestConfig): Promise<Response> {
    const { url, method, headers, data, params } = options;
    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    let finalUrl = url;
    if (params) {
      const query = new URLSearchParams(params).toString();
      finalUrl = `${url}?${query}`;
    }

    if (data) {
      fetchOptions.body = JSON.stringify(data);
      if (!fetchOptions.headers) {
        fetchOptions.headers = {};
      }
      (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }
    
    // NOTE : from https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API : 
    // The fetch() method takes one mandatory argument, the path to the resource you want to fetch. 
    // It returns a Promise that resolves to the Response to that request — as soon as the server responds with headers — 
    // ***even if the server response is an HTTP error status. ***

    // XXX NOTE : response headers MUST be accessed using headers accessor such as .headers.get()
    // because they are not enumerable and as such will not appear in JSON.stringify()

    // NOTE : from https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions : 
    // TypeError
    // Can occur for the following reasons:
    //    The requested URL is invalid.
    //    The requested URL includes credentials (username and password).
    //    The RequestInit object passed as the value of options included properties with invalid values.
    //    The request is blocked by a permissions policy.
    //    There is a network error (for example, because the device does not have connectivity).


    // => This differs from the Axios 
    // => Should error management be changed? 

    // NOTE : from https://developer.riotgames.com/docs/portal#web-apis_response-codes
    /*
    For non-200 response codes please be aware of the following:
    A response body is not guaranteed to be returned.
    If there is a response body, its not guaranteed to be JSON.
    We currently return JSON with human readable debugging information, but the structure and content of this debugging information are subject to change. 
    As an example...
    {
        "status": {
            "message": "Unauthorized",
            "status_code": 401,
        }
    }
    The contents of status, message, and status_code are not guaranteed to always exist or remain constant for a given response code. 
    Logic within your application should fail gracefully based the response code alone, and should not rely on the response body.
    */
    return fetch(finalUrl, fetchOptions)
      .catch((e)=>{
        throw new FetchError("Fetch failed", e)
      })
      .then(async fetchResponse => {
        if (!fetchResponse.ok) {
          throw new ResponseError(
            "Request failed with status code " + fetchResponse.status, 
            fetchResponse.status, 
            await fetchResponse.text().catch(),
            fetchResponse.headers
          )
        }
        return fetchResponse;
      })
  }

  private static getQueue () {
    if (!RequestBase.queue) {
      RequestBase.queue = new PromiseQueue(Infinity, Infinity)
    }
    return RequestBase.queue
  }

  static setConcurrency (concurrency: number) {
    RequestBase.queue = new PromiseQueue(concurrency, Infinity)
  }

  // Throws FetchError if something goes wrong when awaited
  static request (options: FetchRequestConfig): Promise<Response> {
    return RequestBase.getQueue().add(() => RequestBase.sendRequest(options))
  }
}
