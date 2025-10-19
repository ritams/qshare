const express = require('express');
const qrcode = require('qrcode');
const os = require('os');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const archiver = require('archiver');

const app = express();
const port = 3000;

// In-memory storage for shared file paths
let sharedFiles = [];
let shareId = null;

// Get local IP address
const interfaces = os.networkInterfaces();
let localIP;
for (const iface of Object.values(interfaces)) {
  for (const addr of iface) {
    if (addr.family === 'IPv4' && !addr.internal) {
      localIP = addr.address;
      break;
    }
  }
  if (localIP) break;
}

if (!localIP) {
  console.error('Could not find local IP address');
  process.exit(1);
}

// Serve static files from src directory
app.use(express.static(path.join(__dirname)));

app.use(fileUpload());

// Route to serve file selection page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'select.html'));
});

// Download all files as zip
app.get('/download-all', (req, res) => {
  if (!sharedFiles.length) {
    return res.status(404).send('No files shared');
  }
  const archive = archiver('zip', { zlib: { level: 9 } });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="shared-files.zip"');
  archive.pipe(res);
  sharedFiles.forEach(file => {
    archive.append(file.data, { name: file.name });
  });
  archive.finalize();
});

// Serve individual files
app.get('/file/:fileName', (req, res) => {
  const fileName = decodeURIComponent(req.params.fileName);
  const file = sharedFiles.find(f => f.name === fileName);
  if (!file) {
    return res.status(404).send('File not found');
  }
  res.setHeader('Content-Type', file.mimetype || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
  res.send(file.data);
});

// Route to list shared files
app.get('/files', (req, res) => {
  if (!sharedFiles.length) {
    return res.send('<html><body><h1>No files shared</h1><a href="/">Back to selection</a></body></html>');
  }
  let html = `
  <html>
  <head>
    <title>Shared Files</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1 { color: #333; }
      ul { list-style-type: none; padding: 0; }
      li { margin: 10px 0; }
      a { text-decoration: none; color: #007bff; }
      a:hover { text-decoration: underline; }
      button { background: #28a745; color: white; border: none; padding: 10px 20px; cursor: pointer; }
      button:hover { background: #218838; }
    </style>
  </head>
  <body>
    <h1>Shared Files</h1>
    <button onclick="window.location.href='/download-all'">Download All</button>
    <a href="/">Share More Files</a>
    <ul>`;
  sharedFiles.forEach(file => {
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
    html += `<li><a href="/file/${encodeURIComponent(file.name)}">${file.name}</a> (${sizeStr})</li>`;
  });
  html += `</ul></body></html>`;
  res.send(html);
});

// Upload route
app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files uploaded.');
  }
  let uploadedFiles = req.files.file;
  if (!Array.isArray(uploadedFiles)) uploadedFiles = [uploadedFiles];

  // Clear previous shared files and generate new share ID
  sharedFiles = [];
  shareId = Date.now().toString();

  uploadedFiles.forEach(file => {
    // Store file info in memory instead of moving to disk
    sharedFiles.push({
      name: file.name,
      data: file.data,
      size: file.size,
      mimetype: file.mimetype
    });
  });

  const shareUrl = `http://${localIP}:${port}/files`;
  qrcode.toDataURL(shareUrl, (err, dataUrl) => {
    if (err) return res.status(500).send('Error generating QR');
    let html = `
    <html>
    <head>
      <title>Files Shared</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; text-align: center; }
        h1 { color: #28a745; }
        ul { list-style-type: none; padding: 0; display: inline-block; text-align: left; }
        li { margin: 10px 0; }
        img { margin: 20px 0; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <h1>Files Shared Successfully</h1>
      <ul>`;
    sharedFiles.forEach(file => {
      html += `<li>${file.name}</li>`;
    });
    html += `</ul>
      <img src="${dataUrl}" alt="QR Code">
      <p>Scan the QR code to access the files.</p>
    </body>
    </html>`;
    res.send(html);
  });
});

const url = `http://${localIP}:${port}`;

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at ${url}`);
  console.log('Open http://localhost:3000 to select files to share.');
});
