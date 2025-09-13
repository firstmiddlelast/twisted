const http = require('http');

const PORT = 8080;

const server = http.createServer((req: any, res: any) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  switch (true) {
    case path.endsWith("/404"):
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end("Not Found");
      break;
    case path.endsWith("/429"):
      res.writeHead(429, { 'Content-Type': 'text/plain', 'Retry-After': '1' });
      res.end("Too Many Requests");
      break;
    case path.endsWith("/503"):
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end("Service Unavailable");
      break;
    case path.endsWith("/200"):
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ data: "success" }));
      break;
    default:
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end("Hello from HTTP test server!");
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