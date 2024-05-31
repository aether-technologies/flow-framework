import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { FlowNode } from './flow.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname).slice(os.platform() === 'win32' ? 1 : 0);
const ARGS = process.argv.slice(2);
var GLOBAL_CONFIG = getDefaultConfig();
var BASE_MODULE_CONFIG = {};

async function startServer() {
  if (ARGS[0] === '-c' || ARGS[0] === '--config') {
    GLOBAL_CONFIG = JSON.parse(await fs.readFile(ARGS[1], 'utf-8'));
  }
  
  // Initialize Server FlowNode
  const flowNode = new FlowNode({ logging: GLOBAL_CONFIG?.LOGGING === 'DEBUG' });

  // Update relative paths to absolute paths
  if (!GLOBAL_CONFIG.FLOW_DIR || !path.isAbsolute(GLOBAL_CONFIG.FLOW_DIR)) {
    GLOBAL_CONFIG.FLOW_DIR = path.resolve(__dirname, GLOBAL_CONFIG.FLOW_DIR ? GLOBAL_CONFIG.FLOW_DIR : './');
  }
  if (!GLOBAL_CONFIG.WEB_DIR || !path.isAbsolute(GLOBAL_CONFIG.WEB_DIR)) {
    GLOBAL_CONFIG.WEB_DIR = path.resolve(__dirname, GLOBAL_CONFIG.WEB_DIR ? GLOBAL_CONFIG.WEB_DIR : '../www');
  }
  if (!GLOBAL_CONFIG.WORKSPACE || !path.isAbsolute(GLOBAL_CONFIG.WORKSPACE)) {
    GLOBAL_CONFIG.WORKSPACE = path.resolve(__dirname, GLOBAL_CONFIG.WORKSPACE ? GLOBAL_CONFIG.WORKSPACE : '../../');
  }
  if (GLOBAL_CONFIG.SSL_PRIVATE_KEY && !path.isAbsolute(GLOBAL_CONFIG.SSL_PRIVATE_KEY)) {
    GLOBAL_CONFIG.SSL_PRIVATE_KEY = path.resolve(__dirname, GLOBAL_CONFIG.SSL_PRIVATE_KEY);
  }
  if (GLOBAL_CONFIG.SSL_CERTIFICATE && !path.isAbsolute(GLOBAL_CONFIG.SSL_CERTIFICATE)) {
    GLOBAL_CONFIG.SSL_CERTIFICATE = path.resolve(__dirname, GLOBAL_CONFIG.SSL_CERTIFICATE);
  }

  // Initialize base module config
  BASE_MODULE_CONFIG = { ...GLOBAL_CONFIG };
  delete BASE_MODULE_CONFIG.MODULES;
  delete BASE_MODULE_CONFIG.FLOWS;
  delete BASE_MODULE_CONFIG.REMOTE_NODES;

  // Load modules and flows
  if (GLOBAL_CONFIG.MODULES) {
    for (const module of GLOBAL_CONFIG.MODULES) {
      const loaded_module = await loadModule(module);
    }
  }
  if (GLOBAL_CONFIG.FLOWS) {
    for (const flow of GLOBAL_CONFIG.FLOWS) {
      const loaded_flow = await loadModule(flow);
    }
  }
}

async function loadModule(module) {
  var loaded_module = null;
  if (module?.enabled) {
    try {
      if (module.file.startsWith('http://') || module.file.startsWith('https://')) {
        console.log(`Loading remote module: ${module.name} from URL: ${module.file}`);
        loaded_module = await import(module.file);
      } else {
        const modulePath = path.resolve(GLOBAL_CONFIG.FLOW_DIR, module.file);
        console.log(`Loading module: ${module.name} from path: ${modulePath}`);
        loaded_module = await import(`file://${modulePath}`);
      }
    } catch (error) {
      console.error(`Failed to import module: ${module.name}`);
      console.error(error);
    }
  } else {
    console.log(`Module ${module.name} is not enabled.`);
  }
  if (loaded_module && loaded_module.default) {
    const module_instance = new loaded_module.default(module.id || null, { ...BASE_MODULE_CONFIG, ...module.config, ...module.options });
  }
  return loaded_module;
}

function getDefaultConfig() {
  return {
    "NAME": "aethio",
    "PORT": 3000,
    "WORKSPACE": ".",
    "FLOW_DIR": path.normalize(path.join(__dirname, './flows')),
    "MODULES": [],
    "FLOWS": [],
    "REMOTE_NODES": []
  };
}

// Start the server
startServer().catch(console.error);
