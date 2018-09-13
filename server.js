var http = require('http');

var handleRequest = function(request, response) {
  console.log('Received request for URL: ' + request.url);
  response.writeHead(200, {'Content-Type': 'text/html'});
  response.end('<h1>Hello world from the jblue test application!</h1>');
};
var www = http.createServer(handleRequest);
www.listen(8080);
