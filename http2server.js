'use strict';

const fs    = require('fs');
const http2 = require('http2');

const options = {
  key : fs.readFileSync('./localhost.key'),
  cert: fs.readFileSync('./localhost.crt')
};

const db  = {};
let incId = 0;

const routes = {
  "/test/write": function(request, reply, payload) {
    db[++incId] = payload;
    reply.writeHead(200);
    return reply.end(incId.toString());
  },
  "/test/read" : function(request, reply, payload) {
    reply.writeHead(200);
    return reply.end(JSON.stringify(db[payload.id]));
  },
  "/test/list" : function(request, reply) {
    reply.writeHead(200);
    return reply.end(JSON.stringify(db));
  }
};

const onRequest = function(request, reply) {
  if (!routes[request.url]) {
    console.log("Service not found: ", request.url);
    reply.writeHead(404);
    return reply.end();
  }
  let payload = '';
  request.on('data', function(data) {
    payload += data.toString();
  });
  request.on('end', function() {
    console.log("*** Request:", request.url, payload);
    return routes[request.url](request, reply, payload ? JSON.parse(payload) : null);
  });
};

http2.createServer(options, onRequest).listen(8080);