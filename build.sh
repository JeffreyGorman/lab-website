#!/bin/sh
# Rebuilds the minified files the home page loads (js/main.min.js, js/pah-card.min.js, css/*.min.css).
# Run this after editing anything in js/ or css/ (needs Node):   sh build.sh
# The readable source files stay as they are; index.html loads the .min versions.
cd "$(dirname "$0")"
npx --yes esbuild js/main.js --bundle --minify --format=esm --target=es2019 --outfile=js/main.min.js
npx --yes esbuild js/pah-card.js --bundle --minify --format=esm --target=es2019 --outfile=js/pah-card.min.js
npx --yes esbuild css/styles.css --minify --outfile=css/styles.min.css
npx --yes esbuild css/pah-card.css --minify --outfile=css/pah-card.min.css
