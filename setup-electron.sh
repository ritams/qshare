#!/bin/bash

# QShare Electron Setup Script
echo "🚀 Setting up QShare Electron App..."

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Check if icon exists
if [ ! -f "src/assets/icon.png" ]; then
    echo "⚠️  No icon found at src/assets/icon.png"
    echo "   Please create a 512x512 PNG icon for the app"
    echo "   The placeholder file src/assets/icon.png.placeholder contains design suggestions"
fi

echo "✅ Setup complete!"
echo ""
echo "To run the app:"
echo "  Development: bun run electron-dev"
echo "  Production:  bun run dist"
echo ""
echo "The app will open as a regular macOS desktop window! 🍎"
