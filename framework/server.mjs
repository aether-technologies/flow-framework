// process.env.PATH = `${process.env.PATH}:${__dirname}/framework:${__dirname}/src`;
// import Module from 'module';
// Module.__initPaths();

// server.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { FlowNode } from './flow.mjs';

const PORT = 3000;
const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(os.platform() === 'win32' ? 1 : 0);
console.log("__dirname",__dirname);
const WEB_DIR = path.normalize(path.join(__dirname, '../www'));

const server = http.createServer((req, res) => {
  if (req.url === '/sort') {
    // getIP().then(ip => {
    //   res.writeHead(200, { 'Content-Type': 'text/plain' });
    //   res.end(`Your IP is ${ip}`);
    // });
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('ERROR');
  } else {
    let filePath;
    let contentType;
    const relativePath = req.url === '/' ? '/index.html' : req.url;
    let webPath = path.join(WEB_DIR, relativePath);

    // console.log("webPath",webPath);
    // console.log("fs.existsSync(webPath)",fs.existsSync(webPath));

    if(fs.existsSync(webPath)) {
      filePath = webPath;
    } else {
      res.writeHead(404);
      res.end('404 Not Found');
      return;
    }

    if(filePath) {
      contentType = getContentType(path.extname(filePath));

      fs.readFile(filePath, (err, content) => {
        if (err) {
          if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('404 Not Found');
          } else {
            res.writeHead(500);
            res.end('500 Internal Server Error');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    }
  }
});
// #############################################################################

//Entrypoint to the modular system
console.log("Initializing Server FlowNode");
const flowNode = new FlowNode();

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// #############################################################################
function getContentType(extname) {
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
    case '.mjs':
      return 'text/javascript';
    case '.json':
      return 'application/json';
    case '.png':
      return 'image/png';
    case '.jpg':
      return 'image/jpg';
    case '.gif':
      return 'image/gif';
    default:
      return 'text/plain';
  }
}
