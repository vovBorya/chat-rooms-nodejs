import http from "http";
import fs from "fs";
import path from "path";
import mime from "mime";
import chatServer from "./lib/chat-server";

const cache = {};

const send404 = (response) => {
  response.writeHead(404, {'Content-Type': 'text/plain'});
  response.write('Error 404: resource not found');
  response.end();
}

const sendFile = (response, filePath, fileContents) => {
  response.writeHead(
    200,
    {'content-type': mime.lookup(path.basename(filePath))}
  );
  response.end(fileContents);
}

const serveStatic = (response, cache, absPath) => {
  if (cache[absPath]) {
    sendFile(response, absPath, cache[absPath]);
  } else {
    fs.exists(absPath, (exists) => {
      if (exists) {
        fs.readFile(absPath, (err, data) => {
          if (err) {
            send404(response);
          } else {
            cache[absPath] = data;
            sendFile(response, absPath, data);
          }
        });
      } else {
        send404(response);
      }
    });
  }
}

const server = http.createServer((req, res) => {
  const filePath = (req.url === '/') ? 'public/index.html': 'public' + req.url;
  const absPath = './' + filePath;
  serveStatic(res, cache, absPath)
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});

chatServer.listen(server);