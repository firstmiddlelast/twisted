import http from 'http';
import {LolStatusContentDTO} from "../../src/models-dto/status/status-v4"
import { TOO_MANY_REQUESTS, SERVICE_UNAVAILABLE } from 'http-status-codes';

const PORT = 8080;

let requestCounter=0;

const server = http.createServer((req, res) => {
  const path = new URL(req.url!, `http://localhost:${PORT}`).pathname;
  console.log ('http request path : ' + path)
  const apiData : LolStatusContentDTO = {content:"ok",locale:"en-US"} 

  const requestId = requestCounter ++;
  switch (true) {
    case path.endsWith("/429"):
      res.writeHead(TOO_MANY_REQUESTS, { 'Content-Type': 'text/plain', 'x-app-rate-limit': 'none' });
      res.end("Too Many Requests");
      break;
    case path.endsWith("/503"):
      res.writeHead(SERVICE_UNAVAILABLE, { 'Content-Type': 'text/plain' });
      res.end("Service Unavailable");
      break;
    case path.endsWith("/200"):
      res.writeHead(200, { 'Content-Type': 'application/json',  });
      res.end(JSON.stringify({ data: "success" }));
      break;
    case path.endsWith("/status"):
      res.writeHead(200, { 'Content-Type': 'application/json', 'x-app-rate-limit': 'no-limit' });
      res.end(JSON.stringify({locale:"en_GB", content:"Account Transfers Unavailable"} as LolStatusContentDTO));
      break;
    case path.includes("/delay/"):
      const delayMs = parseInt(path.substring(path.indexOf('/delay')).split('/')[2]);
      console.debug(`#${requestId} : ${Date.now()} - Waiting ${delayMs} ms`)
      setTimeout(()=>{
        console.debug(`#${requestId} : ${Date.now()} - Resuming after ${delayMs} ms`)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ data: apiData}));
      }, delayMs)
      break;
    default:
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end("Not Found");
      break;
  }
});

server.listen(PORT, () => {
  console.log(`HTTP Test server running on http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  server.close(() => {
    console.log('HTTP Test server closed.');
    process.exit(0);
  });
});