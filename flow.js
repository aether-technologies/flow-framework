#!/usr/bin/env node
import { program } from 'commander';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const flowClientInstallUrl = 'git+https://github.com/aether-technologies/flow-client.git#main';
const flowServerInstallUrl = 'git+https://github.com/aether-technologies/flow-server.git#main';
const flowServerlessInstallUrl = '';

const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flow Test</title>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js"></script>
    
  <script src="./js/my-module.js" type="module"></script>
  <script src="./index.js" type="module"></script>
</head>
<body>
</body>
</html>`;

const indexJsContent = `
import FlowNode, { FlowMessage } from './js/flow.bundle.mjs';
//Initialize Flow Node`;

const mymoduleContent = `
import { Flow, FlowMessage } from './js/flow.bundle.mjs';

export default class MyModule extends Flow {
    constructor() {
        super("MyModule");
    }
    async run(message) {
        console.log("[MyModule] This is my do-nothing module");
        return new FlowMessage(message.recipient, message.origin, message.content, message.origin);
    }
}

const my_module = new MyModule(); //Initialize the module, which adds it to the FlowManager
`;

// ###########################
// ## Utility Functions 
// ###########################

function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
function initFlowClient() {
    //TODO: either find a different way to do this or make it work on Windows
    execSync('npm init -y -f &> /dev/null && npm install '+flowClientInstallUrl, { stdio: 'inherit' }); // Run npm install flow-client

    const clientDir = 'src/web';
    const staticWebDir = 'www';
    const staticJsDir = 'www/js';
    const staticStylesDir = 'www/css';
    const staticImagesDir = 'www/img';
    createDirectory(clientDir);
    createDirectory(staticWebDir);
    createDirectory(staticJsDir);
    createDirectory(staticStylesDir);
    createDirectory(staticImagesDir);
    fs.writeFileSync(path.join(staticWebDir, 'index.html'), indexHtmlContent);
    fs.writeFileSync(path.join(staticWebDir, 'index.js'), indexJsContent);
    fs.writeFileSync(path.join(clientDir, 'my-module.js'), mymoduleContent);
}

function initFlowServer() {
    //TODO: either find a different way to do this or make it work on Windows
    execSync('npm init -y -f &> /dev/null && npm install '+flowServerInstallUrl, { stdio: 'inherit' }); // Run npm install flow-server

    const serverDir = 'src/server';
    createDirectory(serverDir);
    console.log("TODO: How to properly initialize the 'framework' folder? It needs files copied from somewhere...");
}
function initFlowServerless() {
    console.log("Unfortunately, this initialization is not currently implemented.");
}

function buildFlowSystem() {
    // Run npm install
    execSync('npm install', { stdio: 'inherit' });

    // Create directories
    fs.mkdirSync('build/www/js', { recursive: true });
    fs.mkdirSync('build/www/css', { recursive: true });
    fs.mkdirSync('build/bin', { recursive: true });
    fs.mkdirSync('build/config', { recursive: true });

    // Package the flow-client code
    console.log('Packaging flow-client');
    execSync('cd node_modules/flow-client && npm install && npm run build', { stdio: 'inherit' });

    // Package the server-side code
    console.log('Packaging server-side code');
    // fs.copyFileSync('node_modules', 'build/bin/node_modules');
    fs.cpSync('node_modules', 'build/bin/node_modules', {recursive: true});
    fs.rmSync('build/bin/node_modules/flow-client', { recursive: true, force: true });
    // fs.copyFileSync('framework/*', 'build/bin');
    fs.cpSync('framework', 'build/bin', {recursive: true});
    // fs.copyFileSync('src/all/*', 'build/bin');
    fs.cpSync('src/all', 'build/bin', {recursive: true});
    // fs.copyFileSync('src/server/*', 'build/bin');
    fs.cpSync('src/server', 'build/bin', {recursive: true});

    // Package the client-side code
    console.log('Packaging client-side code');
    // fs.copyFileSync('www/*', 'build/www');
    fs.cpSync('www', 'build/www', {recursive: true});
    // fs.copyFileSync('src/all/*', 'build/www/js');
    fs.cpSync('src/all', 'build/www/js', {recursive: true});
    // fs.copyFileSync('src/web/*', 'build/www/js');
    fs.cpSync('src/web', 'build/www/js', {recursive: true});
    fs.copyFileSync('node_modules/flow-client/dist/*', 'build/www/js/');

    // Finish
    console.log('Done');
    console.log('Start server with: \n  node build/bin/server.mjs');
}

function cleanFlowBuild() {
    // Remove directories and files
    fs.rmSync('build', { recursive: true, force: true });
    fs.rmSync('node_modules', { recursive: true, force: true });
    fs.rmSync('package-lock.json', { force: true });
}

function runFlowSystem() {
    // Run the server
    execSync('node build/bin/server.mjs', { stdio: 'inherit' });
}

// ###########################
// ## CLI Definition
// ###########################
program
    .command('init')
    .option('-t, --type [type]', 'type of initialization')
    .description('Initialize the Flow system')
    .action((cmdObj) => {
        let type = cmdObj.type || "all";
        createDirectory('src/all'); //Everyone gets src/all
        switch (type) {
            case 'all':
                initFlowClient();
                initFlowServer();
                // initFlowServerless(); // Not implemented yet
            case 'client':
                initFlowClient();
                break;
            case 'server':
                initFlowServer();
                break;
            case 'serverless':
                initFlowServerless();
                break;
            default:
                console.error("Invalid initialization type: "+type);
        }
    });
program
    .command('build')
    .description('Build the Flow module')
    .action(buildFlowSystem);

program
    .command('clean')
    .description('Clean up the build')
    .action(cleanFlowBuild);

program
    .command('run')
    .description('Run the Flow server')
    .action(runFlowSystem);
 
program.parse(process.argv);
