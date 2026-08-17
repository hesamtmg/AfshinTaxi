#!/bin/sh
set -e

# Refresh the shared volume nginx serves /_nuxt/* from, so it always
# matches exactly what this container is about to run -- no separately
# built image to fall out of sync with.
rm -rf shared-public/*
cp -r .output/public/. shared-public/

exec node .output/server/index.mjs
