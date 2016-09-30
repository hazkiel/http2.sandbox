'use strict';

const fs       = require('fs');
const path     = require('path');
const http2    = require('http2');
const urlParse = require('url').parse;

const writeUrl = "https://localhost:8080/test/write";
const readUrl  = "https://localhost:8080/test/read";
const listUrl  = "https://localhost:8080/test/list";

// Setting the global logger (optional)
http2.globalAgent = new http2.Agent({
  rejectUnauthorized: true
});

const apiCall = function(url, payload, callback) {
  const options  = urlParse(url);
  options.method = "POST";
  if (payload) {
    options.headers = {
      'Content-Type'  : 'application/json',
      //'Content-Length': JSON.stringify(payload).length
    };
  }

  console.log("*** URL:", url);

  // Optionally verify self-signed certificates.
  if (options.hostname == 'localhost') {
    options.key = fs.readFileSync(path.join(__dirname, '/localhost.key'));
    options.ca  = fs.readFileSync(path.join(__dirname, '/localhost.crt'));
  }

  // Set up the request
  const request = http2.request(options, function(res) {
    let error  = null;
    let result = '';
    res.setEncoding('utf8');
    res.on('error', function(err) {
      error = err;
    });
    res.on('data', function(chunk) {
      result += chunk;
    });
    res.on('end', function() {
      return callback(null, result);
    });
  });

  if (payload) {
    request.write(JSON.stringify(payload));
  }

  request.end();
};

apiCall(writeUrl, "abcd", function(err, id1) {
  if (err) throw err;
  console.log("Write 1 done");
  apiCall(writeUrl, {a: "ab", b: 12}, function(err, id2) {
    if (err) throw err;
    console.log("Write 2 done");
    apiCall(writeUrl, {c: {d: true}, e: {f: "g"}}, function(err, id3) {
      if (err) throw err;
      console.log("Write 3 done");
      apiCall(readUrl, {id: id1}, function(err, read1) {
        if (err) throw err;
        console.log("Read 1 done:", read1);
        apiCall(readUrl, {id: id2}, function(err, read2) {
          if (err) throw err;
          console.log("Read 2 done:", read2);
          apiCall(readUrl, {id: id3}, function(err, read3) {
            if (err) throw err;
            console.log("Read 3 done:", read3);
            apiCall(listUrl, null, function(err, list) {
              if (err) throw err;
              console.log("Listing done:", list);
              process.exit();
            });
          });
        });
      });
    });
  });
});