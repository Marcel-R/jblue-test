var http = require('http');

var handleRequest = function(request, response) {
  console.log('Received request for URL: ' + request.url);
  response.writeHead(200);
  response.end('Hello world from the jblue test application');
};
var www = http.createServer(handleRequest);
www.listen(8080);
