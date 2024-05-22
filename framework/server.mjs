import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { FlowNode } from './flow.mjs';
const ARGS = process.argv.slice(2);
var GLOBAL_CONFIG = getDefaultConfig();
var RESTServer;

async function startServer() {
  if (ARGS[0] === '-c' || ARGS[0] === '--config') {
    GLOBAL_CONFIG = JSON.parse(await fs.readFile(ARGS[1], 'utf-8'));
  }
  
  // Initialize Server FlowNode
  const flowNode = new FlowNode({ logging: config?.LOGGING === 'DEBUG' });
  // Load modules and flows
  if (GLOBAL_CONFIG.MODULES) {
    for (const module of config.MODULES) {
      await loadModule(module);
    }
  }
  if (GLOBAL_CONFIG.FLOWS) {
    for (const flow of config.FLOWS) {
      await loadModule(flow);
    }
  }
}

async function loadModule(module) {
  try {
    if (!module.enabled) {
      console.log(`Module ${module.name} is not enabled.`);
      return null;
    }
    if (module.file.startsWith('http://') || module.file.startsWith('https://')) {
      console.log(`Loading remote module: ${module.name} from URL: ${module.file}`);
      return await import(module.file);
    } else {
      const modulePath = path.resolve(config.FLOW_DIR, module.file);
      console.log(`Loading module: ${module.name} from path: ${modulePath}`);
      return await import(`file://${modulePath}`);
    }
  } catch (error) {
    console.error(`Failed to import module: ${module.name}`);
    console.error(error);
  }
  return null;
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
