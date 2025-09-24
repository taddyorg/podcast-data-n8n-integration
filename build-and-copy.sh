#!/bin/bash
echo "Building TypeScript..."
npm run build
echo "Copying icon files..."
cp nodes/TaddyPodcast/*.svg dist/nodes/TaddyPodcast/ 2>/dev/null
cp nodes/TaddyPodcast/*.png dist/nodes/TaddyPodcast/ 2>/dev/null
echo "Deploying to n8n custom folder..."
cp -r dist/* ~/.n8n/custom/
echo "Build complete! Restart n8n to see changes."
