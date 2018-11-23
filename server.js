var StaticServer = require('static-server');

var server = new StaticServer({
  rootPath: './build/public',
  port: 8001
});

server.start(function() {
  console.log('Server started');
});