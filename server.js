var http = require('http');

var handleRequest = function(request, response) {
  console.log('Received request for URL: ' + request.url);
  response.writeHead(200);
  response.end('<h1>Hello world from the jblue acceptance test application</h1>');
};
var www = http.createServer(handleRequest);
www.listen(8080);
