# flow-framework
The Flow Framework is custom framework based on the FBP (Flow-based Programming) paradigm. 

The idea is to allow any ES6 Javascript module that extends the Flow class to be easily and seemlessly integrated into the client-side or server-side of an application built using the Flow Framework.

## flow-framework-cli

This tool may be installed by running
```bash
npm install --global flow-framework-cli
```

Once installed, a flow project can be started using
```bash
flow init
```

The folder structure of the project should look something like this:
```txt
package.json
node_modules
src
 - all     <- modules intended for both client and server-side use
 - server  <- server-only modules
 - web     <- client-only modules
```

Build the project with
```bash
flow build
```

Once built, you can run the default flow server with
```bash
flow run
```
This will start both the server-side flow node and a web server for hosting the client-side code.

## Using third-party libraries

TODO - fill this out in detail