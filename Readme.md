# QShare

QShare is a simple app to share files over local network.

## ✨ Features

- 🎨 **Modern Beautiful UI** with blood red theme across all pages
- 📁 **Drag & Drop** files directly into the interface
- 📋 **Copy & Paste** support for easy file adding
- 📱 **QR Code Sharing** for mobile devices
- ⚡ **In-Memory Processing** - no files saved to disk
- 🔒 **Local Network Only** - secure file sharing
- 📱 **Responsive Design** - works on all devices
- 🎯 **Intuitive UX** with toast notifications and loading states

## Usage

1. Run `bun start` to start the server.
2. Open http://localhost:3000 in your browser.
3. **Drag & drop files** into the elegant omnibox, **paste files** with Ctrl+V, or click to browse.
4. Click "Share Files" and scan the QR code with your mobile device.
5. Download files directly from your phone/tablet.

**Note:** Files are now stored in memory temporarily instead of being copied to disk, making sharing faster and more efficient.

## 🎨 User Interface

QShare features a modern, **light-themed** interface with:

- **Subtle Deep Purple Accents** (#6366F1) for branding consistency
- **Clean Light Background** with soft gradients
- **Elegant Typography** using Inter font family
- **Smooth Animations** and hover effects
- **Text-based Icons** instead of emojis for a professional look
- **Responsive Layout** that adapts to all screen sizes
- **Consistent Design** across all pages (home, upload success, file list)

## How to Add Files

- **Drag & Drop**: Simply drag files from your file explorer and drop them onto the interface
- **Copy & Paste**: Copy files (Ctrl+C) and paste them (Ctrl+V) directly into QShare
- **File Browser**: Click the drop zone to open the traditional file selection dialog
- **Multiple Files**: All methods support selecting multiple files at once

## 📄 Pages

- **Home Page** (`/`): Modern file selection with drag & drop interface
- **Upload Success** (`/upload`): Shows shared files with prominent QR code
- **File List** (`/files`): Displays shared files with individual download buttons
- **Download All** (`/download-all`): Downloads all files as a ZIP archive

## Dependencies

- archiver
- express
- express-fileupload
- qrcode