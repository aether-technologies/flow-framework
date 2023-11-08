#!/bin/bash

# Create bin directory if it doesn't exist
mkdir -p bin

# Copy everything from src and scripts to bin, except build.sh
cp -rf src/* bin/
cp -rf scripts/* bin/
rm -rf bin/build.sh
