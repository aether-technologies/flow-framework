#!/usr/bin/env node
import { program } from 'commander';
import { exec, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const flowFrameworkInstallUrl = 'flow-framework-cli'; //'git+https://github.com/aether-technologies/flow-framework.git#dev';
const flowClientInstallUrl = 'flow-client'; // 'git+https://github.com/aether-technologies/flow-client.git#main';
const flowServerInstallUrl = 'flow-server'; // 'git+https://github.com/aether-technologies/flow-server.git#main';
const flowServerlessInstallUrl = '';

const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flow Test</title>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js"></script>
    
  <script src="./index.js" type="module"></script>
</head>
<body>
</body>
</html>`;

const indexJsContent = `
import { FlowNode, FlowMessage } from './js/flow.mjs';
//Initialize Flow Node`;

const mymoduleContent = `
import { Flow, FlowMessage } from './js/flow.mjs';

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
    execSync('npm install '+flowClientInstallUrl, { stdio: 'inherit' }); // Run npm install flow-client

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
    
    execSync('cp -rf node_modules/flow-framework-cli/src/web/* src/web');
}

function initFlowServer() {
    //TODO: either find a different way to do this or make it work on Windows
    execSync('npm install '+flowServerInstallUrl, { stdio: 'inherit' }); // Run npm install flow-server

    const serverDir = 'src/server';
    createDirectory(serverDir);
    
    execSync('cp -rf node_modules/flow-framework-cli/src/server/* src/server');
}
function initFlowServerless() {
    console.log("Unfortunately, this initialization is not currently implemented.");
}

function buildFlowSystem() {    
    if (process.platform === 'win32') {
        executeBuildForWindows();
    } else {
        executeBuildForLinux();
    }
}
function executeBuildForLinux() {
    const commands = [
        'npm install',
        'mkdir -p build/www/js build/www/css build/bin build/config',
        'echo "Loading default Flow Server"',
        'cp -rf node_modules/flow-framework-cli/framework/* build/bin/',
        'echo "Packaging flow-client"',
        'cd node_modules/flow-client && npm install && npm run build && cd ../..',
        'echo "Packaging server-side code"',
        'cp -rf node_modules build/bin',
        'rm -rf build/bin/node_modules/flow-client',
        'rm -rf build/bin/node_modules/flow-framework-cli',
        // 'if [ -d framework ] && [ "$(ls -A framework)" ]; then cp -rf framework/* build/bin; fi',
        'if [ -d src/all ] && [ "$(ls -A src/all)" ]; then cp -rf src/all/* build/bin/; fi',
        'if [ -d src/server ] && [ "$(ls -A src/server)" ]; then cp -rf src/server/* build/bin; fi',
        'echo "Packaging client-side code"',
        'if [ -d www ] && [ "$(ls -A www)" ]; then cp -rf www/* build/www; fi',
        'if [ -d src/all ] && [ "$(ls -A src/all)" ]; then cp -rf src/all/* build/www/js; fi',
        'if [ -d src/web ] && [ "$(ls -A src/web)" ]; then cp -rf src/web/* build/www/js; fi',
        'cp -rf node_modules/flow-client/dist/* build/www/js'
        //TODO: Add logic to auto-configure module imports in html
    ];
    for (const command of commands) {
        try {
            execSync(command, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Error executing command "${command}": ${error}`);
            break;
        }
    }
}
function executeBuildForWindows() {
    const commands = [
        'npm install',
        'echo "Loading default Flow Server"',
        'if (Test-Path -Path "node_modules/flow-framework-cli/framework") { cp -r -Force node_modules/flow-framework-cli/framework/* build/bin/ }',
        'echo "Packaging flow-client"',
        'cd node_modules/flow-client; npm install; npm run build; cd ../..',
        'cp -r -Force node_modules/flow-client/dist/* build/www/js',
        'echo "Packaging server-side code"',
        'cp -r node_modules build/bin',
        'if (Test-Path -Path "build/bin/node_modules/flow-client") { Remove-Item -Recurse -Force build/bin/node_modules/flow-client }',
        'if (Test-Path -Path "src/all") { cp -r src/all/* build/bin }',
        'if (Test-Path -Path "src/server") { cp -r src/server/* build/bin }',
        'if (Test-Path -Path "framework") { cp -r framework/* build/bin }',
        'echo "Packaging client-side code"',
        'if (Test-Path -Path "www") { cp -r -Force www/* build/www }',
        'if (Test-Path -Path "src/all") { cp -r -Force src/all/* build/www/js }',
        'if (Test-Path -Path "src/all") { cp -r -Force src/web/* build/www/js }'
    ];

    fs.mkdirSync('build/www/js', { recursive: true });
    fs.mkdirSync('build/www/css', { recursive: true });
    fs.mkdirSync('build/bin', { recursive: true });
    fs.mkdirSync('build/config', { recursive: true });
    for (const command of commands) {
        try {
            execSync(command, { stdio: 'inherit', shell: 'powershell' });
        } catch (error) {
            console.error(`Error executing command "${command}": ${error}`);
            break;
        }
    }
}

function cleanFlowBuild() {
    // Remove directories and files
    fs.rmSync('build', { recursive: true, force: true });
    fs.rmSync('node_modules', { recursive: true, force: true });
    fs.rmSync('package-lock.json', { force: true });
}

function runFlowSystem(cmdObj) {
    let config_file = cmdObj.config || "./build/config/default.json";
    // Run the server
    execSync(`node build/bin/server.mjs --config ${config_file}`, { stdio: 'inherit' });
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
        execSync('npm init -y -f && npm install '+flowFrameworkInstallUrl, { stdio: 'inherit' }); // Run npm install flow-framework
        createDirectory('src/all'); //Everyone gets src/all
        switch (type) {
            case 'all':
                initFlowClient();
                initFlowServer();
                // initFlowServerless(); // Not implemented yet
                break;
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
    .option('-c, --config [config]', 'configuration file to use when running the server')
    .description('Run the Flow server')
    .action(runFlowSystem);
 
program.parse(process.argv);