import http from 'http';
import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

import { FlowNode } from './flow.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(os.platform() === 'win32' ? 1 : 0);

const ARGS = process.argv.slice(2);
console.log("__dirname: ", __dirname);
console.log("ARGS: ", ARGS);
var config = getDefaultConfig();
var RESTServer;
var root_endpoint = '/';
var base_web_path = './www';
var system_logging = true;
var info_logging = false;

async function startServer() {

  if(ARGS[0] === '-c' || ARGS[0] === '--config') {
    config = JSON.parse(await fs.readFile(ARGS[1], 'utf-8'));
  }
  root_endpoint = config.ROOT_ENDPOINT || '/'+config.NAME;
  base_web_path = path.normalize(path.join(__dirname, config.WEB_DIR));
  system_logging = config.LOGGING === 'SYSTEM' || config.LOGGING === 'DEBUG' || config.LOGGING === 'INFO';
  info_logging = config.LOGGING === 'DEBUG' || config.LOGGING === 'INFO';

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

  // #########################################################################

  //Entrypoint to the modular system
  console.log("Initializing Server FlowNode");
  const flowNode = new FlowNode({logging: config?.LOGGING === 'DEBUG'});
  flowNode.flowManager.logging = config?.LOGGING === 'DEBUG';
  flowNode.flowRouter.logging = config?.LOGGING === 'DEBUG';
  flowNode.flowMonitor.logging = config?.LOGGING === 'DEBUG';

  //Load flows
  if(config.MODULES) {
    for(const module of config.MODULES) {
      await loadModule(module);
    }
  }
  if(config.FLOWS) {
    for(const module of config.FLOWS) { //'FLOWS' are modules, too
      await loadModule(module);
    }
  }

  // #########################################################################
}

async function handleRequest(req, res) {
  console.log("Handling request: ", req.url);
  // console.log(" - req :: ",req);
  // console.log(" - res :: ",res);

  let requestPath = req.url;

  // Check if the request is for the specific endpoint
  if (requestPath.startsWith(root_endpoint)) {
    // Remove the root_endpoint from the relativePath
    requestPath = requestPath.slice(root_endpoint.length);
  }

  // console.log("requestPath: ", requestPath);
  const relativePath = requestPath === '/' || requestPath === '' ? '/index.html' : requestPath;
  // console.log("relativePath: ", relativePath);
  const filePath = path.join(base_web_path, relativePath);
  // console.log("filePath: ", filePath);

  try {
    await fs.access(filePath);
  } catch(error) {
    if(info_logging) console.error(error);
    res.writeHead(404);
    res.end('404 Not Found');
    return;
  }

  if(filePath) {

    try {
      const contentType = getContentType(path.extname(filePath));
      const content = await fs.readFile(filePath, 'utf-8');
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    } catch (err) {
      console.error(err);
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('404 Not Found');
      } else {
        res.writeHead(500);
        res.end('500 Internal Server Error');
      }
    }
  }
  console.log("chek end");
};

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
        "name": "ModuleLoader",
        "file": "./node_modules/flow-server/flow/module-loader.mjs",
        "enabled": true
      },
    ],
    "REMOTE_NODES": []
  };
}

//TODO: handle the case where the module is already loaded
async function loadModule(module) {
  console.log("Loading module: ", module);
  if (!module.enabled) {
    console.log(`Module ${module.name} is not enabled.`);
    return null;
  }

  var modulePath = module.file;
  if (os.platform() === 'win32') {
    modulePath = modulePath.replace(/\//g, '\\');
  }
  var file_path;
  try {
    if (modulePath.startsWith('http://') || modulePath.startsWith('https://')) {
      // Remote file URL
      if (system_logging) console.log(`Loading remote module: ${module.name} from URL: ${modulePath}`);
      return await import(modulePath);
    } else if (path.isAbsolute(modulePath)) {
      // Absolute file path
      if (system_logging) console.log(`Loading module: ${module.name} from absolute path: ${modulePath}`);
      return await import(`file://${modulePath}`);
    } else {
      // Relative file path
      if (modulePath.endsWith('.mjs')) {
        modulePath = modulePath.slice(0, -4);
      }
      if (modulePath.endsWith('.js')) {
        modulePath = modulePath.slice(0, -3);
      }
      if (modulePath.includes('/')) {
        modulePath = modulePath.split('/').pop();
      }
      if (modulePath.includes('\\')) {
        modulePath = modulePath.split('\\').pop();
      }
      if (info_logging) console.log(`Searching for module: ${module.name} as ${modulePath} in ${config.FLOW_DIR}`);
      const search_dir = path.normalize(path.join(__dirname, config.FLOW_DIR));
      file_path = await findFileInDirectory(search_dir, modulePath);
      if (file_path) {
        if (info_logging) console.log(`Loading module: ${module.name} from absolute path: ${file_path}`);
        return await import(`file://${file_path}`);
      } else {
        console.error(`Failed to find module: ${module.name} at relative path: ${file_path}`);
      }
    }
  } catch (error) {
    console.error(`Failed to import module: ${module.name}`);
    console.error(error);
  }
  return null;
}

async function findFileInDirectory(directoryPath, fileName) {
  // console.log(`directoryPath: ${directoryPath}, fileName: ${fileName}`);
  const files = await fs.readdir(directoryPath);
  for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const fileStat = await fs.stat(filePath);
      // if (file.includes(fileName)) { console.log("file: ", file); }
      if (fileStat.isDirectory()) {
          const foundFilePath = await findFileInDirectory(filePath, fileName);
          if (foundFilePath) {
              return foundFilePath;
          }
      } else if (file.startsWith(fileName) && (file.endsWith('.js') || file.endsWith('.mjs'))) {
          return filePath;
      }
  }
  return null;
}


/// Start the server
startServer();