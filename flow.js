#!/usr/bin/env node
import { program } from 'commander';
import { exec } from 'child_process';

program
    .command('init')
    .description('Initialize the Flow module framework')
    .action(() => {
        console.log("Initializing the Flow module framework...");
    });

program
    .command('build')
    .description('Build the Flow module')
    .action(() => {
        // Execute the build script based on the OS
        if (process.platform === 'win32') {
            exec('scripts/build-flow-system.ps1', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        } else {
            exec('./scripts/build-flow-system.sh', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        }
    });

program
    .command('clean')
    .description('Clean up the build')
    .action(() => {
        // Execute the clean script based on the OS
        if (process.platform === 'win32') {
            exec('scripts/clean-flow-build.ps1', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);m
                    return;
                }
                console.log(stdout);
            });
        } else {
            exec('./scripts/clean-flow-build.sh', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        }
    });

program
    .command('run')
    .description('Run the Flow server')
    .action(() => {
        // Execute the run script based on the OS
        if (process.platform === 'win32') {
            exec('scripts/run-flow-system.ps1', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        } else {
            exec('./scripts/run-flow-system.sh', (err, stdout, stderr) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        }
    });

program.parse(process.argv);
