var http = require('http');

var handleRequest = function(request, response) {
  console.log('Received request for URL: ' + request.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write("The date and time are currently: " + dt.myDateTime());
  response.end('<h1>Hello world from the jblue test application</h1>');
};
var www = http.createServer(handleRequest);
www.listen(8080);
