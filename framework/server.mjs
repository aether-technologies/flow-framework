import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

import { FlowNode } from './flow.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(os.platform() === 'win32' ? 1 : 0);
const ARGS = process.argv.slice(2);
console.log("__dirname: ", __dirname);
console.log("ARGS: ", ARGS);
const config = ARGS[0] === '-c' || ARGS[0] === '--config' ? JSON.parse(require(ARGS[1])) : getDefaultConfig();


function handleRequest(req, res) {
  let filePath;
  let contentType;
  const relativePath = req.url === '/' ? '/index.html' : req.url;
  let webPath = path.join(config.WEB_DIR, relativePath);

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
};

var RESTServer;
if (config.SSL_CERTIFICATE) {
  const options = {
    key: fs.readFileSync(config.SSL_PRIVATE_KEY),
    cert: fs.readFileSync(config.SSL_CERTIFICATE)
  };
  RESTServer = https.createServer(options, handleRequest);
  RESTServer.listen(config.PORT, () => {
    console.log(`Secure server running at https://localhost:${config.PORT}`);
  });
} else {
  RESTServer = http.createServer(handleRequest);
  RESTServer.listen(config.PORT, () => {
    console.log(`Server running at http://localhost:${config.PORT}`);
  });
}

// #############################################################################

//Entrypoint to the modular system
console.log("Initializing Server FlowNode");
const flowNode = new FlowNode({logging: false});
flowNode.flowManager.logging = false;
flowNode.flowRouter.logging = false;
flowNode.flowMonitor.logging = false;

//Load flows
for(const module of config.MODULES) {
  loadModule(module);
}
for(const module of config.FLOWS) { //'FLOWS' are modules, too
  loadModule(module);
}

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

function getDefaultConfig() {
  return {
    "NAME": "aethio",
    "PORT": 3000,
    "SSL_CERTIFICATE": "/opt/aethio/config/certificate.pem",
    "SSL_PRIVATE_KEY": "/opt/aethio/config/privatekey.pem",
    "WORKSPACE": ".",
    "WEB_DIR": path.normalize(path.join(__dirname, '../www')),
    "FLOW_DIR": __dirname,
    "FLOWS": [
      {
        "name": "FileServer",
        "file": './fs/FileServer.mjs',
        "enabled": true
      }
    ],
    "REMOTE_NODES": []
  };
}

//TODO: handle the case where the module is already loaded
//TODO: handle absolute paths
async function loadModule(module) {
  if(!module.enabled) {
    console.log(`Module ${module.name} is not enabled.`);
    return null;
  }
  try {
    var modulePath = module.file;
    var split_path;
    //Remove the file extension
    if(modulePath.includes(".")) {
        split_path = modulePath.split(".");
        split_path.pop();
        modulePath = split_path.join(".");
    }
    split_path = modulePath.split("/");
    const file_name = split_path.pop();
    
    if(this.logging) console.log(`Searching for module: ${module.name} at path: ${modulePath}`);
    const file_path = await this.findFileInDirectory('./', file_name);
    if(this.logging) console.log(" - ",this.root + file_path);

    if(this.logging) console.log(`Loading module: ${module.name} at path: ${this.root + file_path}`);
    const module = await import(this.root + file_path);
    return module;
  } catch (error) {
      console.error(`Failed to import module at path: ${modulePath}`);
      console.error(error);
  }
  return null;
}