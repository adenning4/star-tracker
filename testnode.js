// This module to act as server, manage needed updates from client, provide data in JSON format from some local storage,
// call to the web and update local storage when needed
// create skeleton ui for manual manipulation if needed

var http = require("http");

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://127.0.0.1:5500",
      Vary: "Origin",
    });
    res.end(
      JSON.stringify({
        data: "test",
        other: "test2",
        requestHeaders: req.headers,
      })
    );
  })
  .listen(8080);
