import { LolApi } from "../../src/apis";
import { Regions } from "../../src/constants";
import { ApiResponseDTO, LolStatusPlatformDataDTO } from '../../src/models-dto/index';
import { GenericError } from '../../src/errors';
import fs from "node:fs";

jest.setTimeout(10000);

describe('Use the live API with an actual API key', () => {

    let apiKey:string|undefined;
    const ENV_FILE_NAME = ".env";
    const KEY_NAME = "RIOT_API_KEY";

    beforeEach(() => {
        apiKey = String(fs.readFileSync(ENV_FILE_NAME))
            .split("\n").find((l)=>l.startsWith(KEY_NAME+"="))?.split("=")[1];
        if (!apiKey) throw "No valid " + KEY_NAME + " entry could be found in " + ENV_FILE_NAME
    });    

    it('Get live lol status', async () => {
        const statusResponse : ApiResponseDTO<LolStatusPlatformDataDTO> = await new LolApi({key:apiKey}).StatusV4.get(Regions.EU_WEST);
        // We have to explicitly enumerate the ApiResponseDTO properties 
        // because we have no reflexion available in the declareation of the class
        expect(statusResponse).toHaveProperty("rateLimits");
        expect(statusResponse).toHaveProperty("response");
        // Same thing for LolStatusPlatformDataDTO
        expect(statusResponse.response).toHaveProperty("id");
        expect(statusResponse.response).toHaveProperty("name");
        expect(statusResponse.response).toHaveProperty("locales");
        expect(statusResponse.response).toHaveProperty("maintenances");
        expect(statusResponse.response).toHaveProperty("incidents");
        expect(statusResponse.response.name).toBe("EU West");
    })

    it('Get live lol status - wrong API key', async () => {
        try {
            await new LolApi({key:"WRONG"}).StatusV4.get(Regions.EU_WEST);
            fail ('Should throw an exception')
        }
        catch (e) {
            expect(e).toBeInstanceOf(GenericError);
            const ge = e as GenericError;
            expect(ge.name).toBe(GenericError.name);
            expect(ge.message).toBe("Request failed with status code 401");
            expect(ge.body).toBeTruthy();
            expect(ge.status).toBe(401);
            expect(ge.error).toBeTruthy();
            expect(ge.rateLimits).toBeTruthy();
            expect(ge.rateLimits.RetryAfter).toBe(0);
            // console.log ("WRONG KEY EXCEPTION : " + e + JSON.stringify(e))
            // WRONG KEY EXCEPTION : GenericError: Request failed with status code 401
            const expected = {
                "name":"GenericError",
                "status":401,
                "body":{
                    "status":{
                        "message":"Forbidden","status_code":401}
                    },
                    "rateLimits":{
                        "Type":null,"AppRateLimit":null,"AppRateLimitCount":null,
                        "MethodRatelimitCount":null,"RetryAfter":0
                    },
                    "error":{
                        "message":"Request failed with status code 401",
                        "name":"AxiosError",
                        "stack":"AxiosError: Request failed with status code 401\n    at settle (/home/p-h/dev/twisted-fetch/node_modules/axios/lib/core/settle.js:19:12)\n    at Unzip.handleStreamEnd (/home/p-h/dev/twisted-fetch/node_modules/axios/lib/adapters/http.js:617:11)\n    at Unzip.emit (node:events:530:35)\n    at endReadableNT (node:internal/streams/readable:1698:12)\n    at processTicksAndRejections (node:internal/process/task_queues:90:21)\n    at Axios.request (/home/p-h/dev/twisted-fetch/node_modules/axios/lib/core/Axios.js:45:41)\n    at processTicksAndRejections (node:internal/process/task_queues:105:5)",
                        "config":{
                            "transitional":{
                                "silentJSONParsing":true,"forcedJSONParsing":true,"clarifyTimeoutError":false
                            },
                            "adapter":["xhr","http","fetch"],
                            "transformRequest":[null],"transformResponse":[null],"timeout":0,"xsrfCookieName":"XSRF-TOKEN","xsrfHeaderName":"X-XSRF-TOKEN","maxContentLength":-1,"maxBodyLength":-1,
                            "env":{},
                            "headers":{
                                "Accept":"application/json, text/plain, */*","X-Riot-Token":"WRONG","User-Agent":"axios/1.12.1","Accept-Encoding":"gzip, compress, deflate, br"
                            },
                            "url":"https://euw1.api.riotgames.com/lol/status/v4/platform-data","method":"get","allowAbsoluteUrls":true
                        },
                        "code":"ERR_BAD_REQUEST",
                        "status":401
                    }
            }
        }
    })

    it('Get live lol status - wrong region', async () => {
        try {
            await new LolApi().StatusV4.get("GALAXY" as Regions);
            fail ('Should throw an exception')
        }
        catch (e) {
            // Champs récupérés d'AxiosError dans GenericError : 
            // error.message vers .message, 
            // error.response?.status vers .status, 
            // error.response?.data vers .body
            expect(e).toBeInstanceOf(GenericError);
            const ge = e as GenericError;
            expect(ge.message).toBeTruthy();
                // ..mais pour cette erreur c'est 500 par défaut
            expect(ge.status).toBe(500);
                // ..mais pour cette erreur c'est undefined
            expect(ge.body).toBeUndefined();
            expect(ge.rateLimits).toBeTruthy();
            expect(ge.rateLimits.RetryAfter).toBe(0);
            // L'objet AxiosError est rangé dans le champ GenericError.error
            expect(ge.error).toBeTruthy();
            //console.log ("WRONG REGION EXCEPTION : " + JSON.stringify(e))
            // TODO : check error properties (type, message, etc.)
    /* Original message : 
    GenericError: getaddrinfo ENOTFOUND galaxy.api.riotgames.com
    at StatusV4Api.getError (/home/p-h/dev/twisted-fetch/src/base/base.ts:4924:12)
    at StatusV4Api.<anonymous> (/home/p-h/dev/twisted-fetch/src/base/base.ts:4941:39)
    at Generator.next (<anonymous>)
    at /home/p-h/dev/twisted-fetch/src/base/base.ts:4564:40
    at new Promise (<anonymous>)
    at Object.<anonymous>.__awaiter (/home/p-h/dev/twisted-fetch/src/base/base.ts:4513:10)
    at StatusV4Api.retryRateLimit (/home/p-h/dev/twisted-fetch/src/base/base.ts:4936:12)
    at StatusV4Api.<anonymous> (/home/p-h/dev/twisted-fetch/src/base/base.ts:5162:27)
    at Generator.throw (<anonymous>)
    at rejected (/home/p-h/dev/twisted-fetch/src/base/base.ts:4541:32)
    at processTicksAndRejections (node:internal/process/task_queues:105:5) 

Original exception : {
  status: 500,
  body: undefined,
  rateLimits: {
    Type: null,
    AppRateLimit: null,
    AppRateLimitCount: null,
    MethodRateLimit: undefined,
    MethodRatelimitCount: null,
    RetryAfter: 0,
    EdgeTraceId: undefined
  },
  error: AxiosError {
    hostname: 'galaxy.api.riotgames.com',
    syscall: 'getaddrinfo',
    code: 'ENOTFOUND',
    errno: -3008,
    message: 'getaddrinfo ENOTFOUND galaxy.api.riotgames.com',
    name: 'Error',
    config: {
      transitional: {
        silentJSONParsing: true,
        forcedJSONParsing: true,
        clarifyTimeoutError: false
      },
      adapter: [ 'xhr', 'http', 'fetch' ],
      transformRequest: [ [Function: transformRequest] ],
      transformResponse: [ [Function: transformResponse] ],
      timeout: 0,
      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',
      maxContentLength: -1,
      maxBodyLength: -1,
      env: {
        FormData: [Function: FormData] [FormData] {
          LINE_BREAK: '\r\n',
          DEFAULT_CONTENT_TYPE: 'application/octet-stream'
        },
        Blob: [class Blob]
      },
      validateStatus: [Function: validateStatus],
      headers: Object [AxiosHeaders] {
        Accept: 'application/json, text/plain, * /*',
        'Content-Type': undefined,
        'X-Riot-Token': 'RGAPI-426887da-13f6-463b-b3b3-e1510ea68102',
        'User-Agent': 'axios/1.12.1',
        'Accept-Encoding': 'gzip, compress, deflate, br'
      },
      url: 'https://galaxy.api.riotgames.com/lol/status/v4/platform-data',
      method: 'get',
      allowAbsoluteUrls: true,
      data: undefined
    },
    request: <ref *1> Writable {
      _events: {
        close: undefined,
        error: [Function: handleRequestError],
        prefinish: undefined,
        finish: undefined,
        drain: undefined,
        response: [Function: handleResponse],
        socket: [Function: handleRequestSocket]
      },
      _writableState: WritableState {
        highWaterMark: 65536,
        length: 0,
        corked: 0,
        onwrite: [Function: bound onwrite],
        writelen: 0,
        bufferedIndex: 0,
        pendingcb: 0,
        [Symbol(kState)]: 17580812,
        [Symbol(kBufferedValue)]: null
      },
      _maxListeners: undefined,
      _options: {
        maxRedirects: 21,
        maxBodyLength: Infinity,
        protocol: 'https:',
        path: '/lol/status/v4/platform-data',
        method: 'GET',
        headers: [Object: null prototype] {
          Accept: 'application/json, text/plain, * /*',
          'X-Riot-Token': 'RGAPI-426887da-13f6-463b-b3b3-e1510ea68102',
          'User-Agent': 'axios/1.12.1',
          'Accept-Encoding': 'gzip, compress, deflate, br'
        },
        agents: { http: undefined, https: undefined },
        auth: undefined,
        family: undefined,
        beforeRedirect: [Function: dispatchBeforeRedirect],
        beforeRedirects: { proxy: [Function: beforeRedirect] },
        hostname: 'galaxy.api.riotgames.com',
        port: '',
        agent: undefined,
        nativeProtocols: {
          'http:': {
            _connectionListener: [Function: connectionListener],
            METHODS: [Array],
            STATUS_CODES: [Object],
            Agent: [Function],
            ClientRequest: [Function: ClientRequest],
            IncomingMessage: [Function: IncomingMessage],
            OutgoingMessage: [Function: OutgoingMessage],
            Server: [Function: Server],
            ServerResponse: [Function: ServerResponse],
            createServer: [Function: createServer],
            validateHeaderName: [Function],
            validateHeaderValue: [Function],
            get: [Function: get],
            request: [Function: request],
            setMaxIdleHTTPParsers: [Function: setMaxIdleHTTPParsers],
            maxHeaderSize: [Getter],
            globalAgent: [Getter/Setter],
            WebSocket: [Getter],
            CloseEvent: [Getter],
            MessageEvent: [Getter]
          },
          'https:': {
            Agent: [Function: Agent],
            globalAgent: [Agent],
            Server: [Function: Server],
            createServer: [Function: createServer],
            get: [Function: get],
            request: [Function: request]
          }
        },
        pathname: '/lol/status/v4/platform-data'
      },
      _ended: true,
      _ending: true,
      _redirectCount: 0,
      _redirects: [],
      _requestBodyLength: 0,
      _requestBodyBuffers: [],
      _eventsCount: 3,
      _onNativeResponse: [Function (anonymous)],
      _currentRequest: <ref *2> ClientRequest {
        _events: [Object: null prototype] {
          response: [Function: bound onceWrapper] {
            listener: [Function (anonymous)]
          },
          abort: [Function (anonymous)],
          aborted: [Function (anonymous)],
          connect: [Function (anonymous)],
          error: [Function (anonymous)],
          socket: [Function (anonymous)],
          timeout: [Function (anonymous)]
        },
        _eventsCount: 7,
        _maxListeners: undefined,
        outputData: [],
        outputSize: 0,
        writable: true,
        destroyed: false,
        _last: true,
        chunkedEncoding: false,
        shouldKeepAlive: true,
        maxRequestsOnConnectionReached: false,
        _defaultKeepAlive: true,
        useChunkedEncodingByDefault: false,
        sendDate: false,
        _removedConnection: false,
        _removedContLen: false,
        _removedTE: false,
        strictContentLength: false,
        _contentLength: 0,
        _hasBody: true,
        _trailer: '',
        finished: true,
        _headerSent: true,
        _closed: false,
        _header: 'GET /lol/status/v4/platform-data HTTP/1.1\r\n' +
          'Accept: application/json, text/plain, * /*\r\n' +
          'X-Riot-Token: RGAPI-426887da-13f6-463b-b3b3-e1510ea68102\r\n' +
          'User-Agent: axios/1.12.1\r\n' +
          'Accept-Encoding: gzip, compress, deflate, br\r\n' +
          'Host: galaxy.api.riotgames.com\r\n' +
          'Connection: keep-alive\r\n' +
          '\r\n',
        _keepAliveTimeout: 0,
        _onPendingData: [Function: nop],
        agent: Agent {
          _events: [Object: null prototype] {
            free: [Function (anonymous)],
            newListener: [Function: maybeEnableKeylog]
          },
          _eventsCount: 2,
          _maxListeners: undefined,
          defaultPort: 443,
          protocol: 'https:',
          options: [Object: null prototype] {
            keepAlive: true,
            scheduling: 'lifo',
            timeout: 5000,
            noDelay: true,
            path: null
          },
          requests: [Object: null prototype] {},
          sockets: [Object: null prototype] {
            'galaxy.api.riotgames.com:443:::::::::::::::::::::': [Array]
          },
          freeSockets: [Object: null prototype] {
            'euw1.api.riotgames.com:443:::::::::::::::::::::': [Array]
          },
          keepAliveMsecs: 1000,
          keepAlive: true,
          maxSockets: Infinity,
          maxFreeSockets: 256,
          scheduling: 'lifo',
          maxTotalSockets: Infinity,
          totalSocketCount: 2,
          maxCachedSessions: 100,
          _sessionCache: { map: [Object], list: [Array] },
          [Symbol(shapeMode)]: false,
          [Symbol(kCapture)]: false
        },
        socketPath: undefined,
        method: 'GET',
        maxHeaderSize: undefined,
        insecureHTTPParser: undefined,
        joinDuplicateHeaders: undefined,
        path: '/lol/status/v4/platform-data',
        _ended: false,
        res: null,
        aborted: false,
        timeoutCb: [Function: emitRequestTimeout],
        upgradeOrConnect: false,
        parser: null,
        maxHeadersCount: null,
        reusedSocket: false,
        host: 'galaxy.api.riotgames.com',
        protocol: 'https:',
        _redirectable: [Circular *1],
        [Symbol(shapeMode)]: false,
        [Symbol(kCapture)]: false,
        [Symbol(kBytesWritten)]: 0,
        [Symbol(kNeedDrain)]: false,
        [Symbol(corked)]: 0,
        [Symbol(kChunkedBuffer)]: [],
        [Symbol(kChunkedLength)]: 0,
        [Symbol(kSocket)]: <ref *3> TLSSocket {
          _tlsOptions: {
            allowHalfOpen: undefined,
            pipe: false,
            secureContext: [SecureContext],
            isServer: false,
            requestCert: true,
            rejectUnauthorized: true,
            session: undefined,
            ALPNProtocols: undefined,
            requestOCSP: undefined,
            enableTrace: undefined,
            pskCallback: undefined,
            highWaterMark: undefined,
            onread: undefined,
            signal: undefined
          },
          _secureEstablished: false,
          _securePending: false,
          _newSessionPending: false,
          _controlReleased: true,
          secureConnecting: true,
          _SNICallback: null,
          servername: null,
          alpnProtocol: null,
          authorized: false,
          authorizationError: null,
          encrypted: true,
          _events: [Object: null prototype] {
            close: [Array],
            end: [Array],
            error: [Function: socketErrorListener],
            newListener: [Function: keylogNewListener],
            connect: [Array],
            secure: [Function: onConnectSecure],
            session: [Function (anonymous)],
            free: [Function: onFree],
            timeout: [Array],
            agentRemove: [Function: onRemove],
            data: undefined,
            drain: [Function: ondrain]
          },
          _eventsCount: 11,
          connecting: false,
          _hadError: true,
          _parent: null,
          _host: 'galaxy.api.riotgames.com',
          _closeAfterHandlingError: false,
          _readableState: ReadableState {
            highWaterMark: 65536,
            buffer: [],
            bufferIndex: 0,
            length: 0,
            pipes: [],
            awaitDrainWriters: null,
            [Symbol(kState)]: 59779574,
            [Symbol(kErroredValue)]: [Error]
          },
          _writableState: WritableState {
            highWaterMark: 65536,
            length: 274,
            corked: 0,
            onwrite: [Function: bound onwrite],
            writelen: 274,
            bufferedIndex: 0,
            pendingcb: 1,
            [Symbol(kState)]: 118260214,
            [Symbol(kBufferedValue)]: null,
            [Symbol(kWriteCbValue)]: [Function: bound onFinish],
            [Symbol(kErroredValue)]: [Error]
          },
          allowHalfOpen: false,
          _maxListeners: undefined,
          _sockname: null,
          _pendingData: 'GET /lol/status/v4/platform-data HTTP/1.1\r\n' +
            'Accept: application/json, text/plain, * /*\r\n' +
            'X-Riot-Token: RGAPI-426887da-13f6-463b-b3b3-e1510ea68102\r\n' +
            'User-Agent: axios/1.12.1\r\n' +
            'Accept-Encoding: gzip, compress, deflate, br\r\n' +
            'Host: galaxy.api.riotgames.com\r\n' +
            'Connection: keep-alive\r\n' +
            '\r\n',
          _pendingEncoding: 'latin1',
          server: undefined,
          _server: null,
          ssl: null,
          _requestCert: true,
          _rejectUnauthorized: true,
          timeout: 5000,
          parser: null,
          _httpMessage: [Circular *2],
          [Symbol(alpncallback)]: null,
          [Symbol(res)]: TLSWrap {
            _parent: [TCP],
            _parentWrap: null,
            _secureContext: [SecureContext],
            reading: false,
            onkeylog: [Function: onkeylog],
            onhandshakestart: [Function: noop],
            onhandshakedone: [Function (anonymous)],
            onocspresponse: [Function: onocspresponse],
            onnewsession: [Function: onnewsessionclient],
            onerror: [Function: onerror],
            [Symbol(owner_symbol)]: [Circular *3]
          },
          [Symbol(verified)]: false,
          [Symbol(pendingSession)]: null,
          [Symbol(async_id_symbol)]: 1273,
          [Symbol(kHandle)]: null,
          [Symbol(lastWriteQueueSize)]: 0,
          [Symbol(timeout)]: Timeout {
            _idleTimeout: -1,
            _idlePrev: null,
            _idleNext: null,
            _idleStart: 6924,
            _onTimeout: null,
            _timerArgs: undefined,
            _repeat: null,
            _destroyed: true,
            [Symbol(refed)]: false,
            [Symbol(kHasPrimitive)]: false,
            [Symbol(asyncId)]: 1275,
            [Symbol(triggerId)]: 0,
            [Symbol(kAsyncContextFrame)]: undefined
          },
          [Symbol(kBuffer)]: null,
          [Symbol(kBufferCb)]: null,
          [Symbol(kBufferGen)]: null,
          [Symbol(shapeMode)]: true,
          [Symbol(kCapture)]: false,
          [Symbol(kSetNoDelay)]: false,
          [Symbol(kSetKeepAlive)]: true,
          [Symbol(kSetKeepAliveInitialDelay)]: 60,
          [Symbol(kBytesRead)]: 0,
          [Symbol(kBytesWritten)]: 0,
          [Symbol(connect-options)]: {
            rejectUnauthorized: true,
            ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
            checkServerIdentity: [Function: checkServerIdentity],
            minDHSize: 1024,
            maxRedirects: 21,
            maxBodyLength: Infinity,
            protocol: 'https:',
            path: null,
            method: 'GET',
            headers: [Object: null prototype],
            agents: [Object],
            auth: undefined,
            family: undefined,
            beforeRedirect: [Function: dispatchBeforeRedirect],
            beforeRedirects: [Object],
            hostname: 'galaxy.api.riotgames.com',
            port: 443,
            agent: undefined,
            nativeProtocols: [Object],
            pathname: '/lol/status/v4/platform-data',
            _defaultAgent: [Agent],
            host: 'galaxy.api.riotgames.com',
            keepAlive: true,
            scheduling: 'lifo',
            timeout: 5000,
            noDelay: true,
            servername: 'galaxy.api.riotgames.com',
            _agentKey: 'galaxy.api.riotgames.com:443:::::::::::::::::::::',
            encoding: null,
            keepAliveInitialDelay: 1000
          }
        },
        [Symbol(kOutHeaders)]: [Object: null prototype] {
          accept: [ 'Accept', 'application/json, text/plain, * /*' ],
          'x-riot-token': [
            'X-Riot-Token',
            'RGAPI-426887da-13f6-463b-b3b3-e1510ea68102'
          ],
          'user-agent': [ 'User-Agent', 'axios/1.12.1' ],
          'accept-encoding': [ 'Accept-Encoding', 'gzip, compress, deflate, br' ],
          host: [ 'Host', 'galaxy.api.riotgames.com' ]
        },
        [Symbol(errored)]: null,
        [Symbol(kHighWaterMark)]: 65536,
        [Symbol(kRejectNonStandardBodyWrites)]: false,
        [Symbol(kUniqueHeaders)]: null
      },
      _currentUrl: 'https://galaxy.api.riotgames.com/lol/status/v4/platform-data',
      [Symbol(shapeMode)]: true,
      [Symbol(kCapture)]: false
    }
  }
}
*/
        }
    })
})