# QShare

QShare is a simple app to share files over local network with both web and native macOS desktop versions.

## ✨ Features

- 🎨 **Modern Beautiful UI** with deep purple theme across all pages
- 📁 **Drag & Drop** files directly into the interface
- 📋 **Copy & Paste** support for easy file adding
- 📱 **QR Code Sharing** for mobile devices
- ⚡ **In-Memory Processing** - no files saved to disk
- 🔒 **Local Network Only** - secure file sharing
- 📱 **Responsive Design** - works on all devices
- 🎯 **Intuitive UX** with toast notifications and loading states
- 🍎 **macOS Desktop App** - native windowed application

## Usage

### Web Version
1. Run `bun run dev` to start the web server.
2. Open http://localhost:3000 in your browser.

### macOS Desktop App
1. Install dependencies: `bun install`
2. Run in development: `bun run electron-dev`
3. Or build for production: `bun run dist`
4. The app opens as a regular desktop window

**Note:** Files are now stored in memory temporarily instead of being copied to disk, making sharing faster and more efficient.

## macOS Desktop App Features

- **Native macOS Window**: Standard macOS window with title bar and controls
- **Resizable Window**: Adjust window size as needed (default 1000x700)
- **Standard Window Behavior**: Minimize, maximize, close buttons work normally
- **Background Server**: Express server runs while the app is open
- **Clean Exit**: App quits completely when window is closed
- **Custom Icon**: Purple "Q" icon in Dock and Application folder

## How to Add Files

- **Drag & Drop**: Simply drag files from your file explorer and drop them onto the interface
- **Copy & Paste**: Copy files (Ctrl+C) and paste them (Ctrl+V) directly into QShare
- **File Browser**: Click the drop zone to open the traditional file selection dialog
- **Multiple Files**: All methods support selecting multiple files at once

## Pages

- **Home Page** (`/`): Modern file selection with drag & drop interface
- **Upload Success** (`/upload`): Shows shared files with prominent QR code
- **File List** (`/files`): Displays shared files with individual download buttons
- **Download All** (`/download-all`): Downloads all files as a ZIP archive

## Development Scripts

- `bun run dev` - Start web development server
- `bun run electron` - Run Electron app
- `bun run electron-dev` - Run Electron app in development mode
- `bun run build` - Build Electron app for distribution
- `bun run dist` - Create distributable package

## Dependencies

- archiver
- express
- express-fileupload
- qrcode
- electron (for desktop app)
- electron-builder (for packaging)

## Building for Distribution

```bash
# Install dependencies
bun install

# Build for macOS
bun run dist
```

This creates a `.dmg` file in the `dist` folder that can be installed on any macOS machine.