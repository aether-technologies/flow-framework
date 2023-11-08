#!/bin/bash

npm install
mkdir -p build/www/js build/www/css build/bin build/config

# package the flow-client code
echo "Packaging flow-client"
cd node_modules/flow-client
npm install
npm run build
cd ../..

# package the server-side code
echo "Packaging server-side code"
cp -rf node_modules build/bin
rm -rf build/bin/node_modules/flow-client
cp -rf framework/* build/bin
cp -rf src/all/* build/bin
cp -rf src/server/* build/bin

# package the client-side code
echo "Packaging client-side code"
cp -rf www/* build/www
cp -rf src/all/* build/www/js
cp -rf src/web/* build/www/js
mv node_modules/flow-client/dist/* build/www/js/

# finish
echo "Done"
echo -e "Start server with: \n  node build/bin/server.mjs"
