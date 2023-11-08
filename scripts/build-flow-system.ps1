$PWD = Get-Location

npm install

New-Item -ItemType Directory -Path "$PWD\build\www\js" -Force
New-Item -ItemType Directory -Path "$PWD\build\www\css" -Force
New-Item -ItemType Directory -Path "$PWD\build\bin" -Force
New-Item -ItemType Directory -Path "$PWD\build\config" -Force

# package the flow-client code
Write-Host "Packaging flow-client"
cd node_modules\flow-client
npm install
npm run build
cd $PWD
Copy-Item -Path "node_modules\flow-client\dist\*" -Destination "build\www\js" -Force

# package the server-side code
Write-Host "Packaging server-side code"
Copy-Item -Path "node_modules" -Destination "build\bin" -Recurse -Force
Remove-Item -Path "build\bin\node_modules\flow-client" -Recurse -Force
Copy-Item -Path "src\all\*" -Destination "build\bin" -Recurse -Force
Copy-Item -Path "src\server\*" -Destination "build\bin" -Recurse -Force
Copy-Item -Path "framework\*" -Destination "build\bin" -Recurse -Force

# package the client-side code
Write-Host "Packaging client-side code"
Copy-Item -Path "www" -Destination "build" -Recurse -Force
Copy-Item -Path "src\all\*" -Destination "build\www\js" -Recurse -Force
Copy-Item -Path "src\web\*" -Destination "build\www\js" -Recurse -Force

# finish
Write-Host "Done"
Write-Host "Start server with: `n  node build/bin/server.mjs"