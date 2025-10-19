const express = require('express');
const qrcode = require('qrcode');
const os = require('os');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const archiver = require('archiver');

const app = express();
const port = 3000;

// Helper functions for HTML generation
function getFileIcon(mimeType) {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦';
  if (mimeType.includes('text')) return '📝';
  return '📄';
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    return res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>No Files Shared - QShare</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --accent-color: #6366F1;
          --accent-light: #8B5CF6;
          --light-bg: #FFFFFF;
          --light-gray: #F8F9FA;
          --medium-gray: #E9ECEF;
          --dark-gray: #495057;
          --text-primary: #212529;
          --text-secondary: #6C757D;
          --border-color: #DEE2E6;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, var(--light-gray) 0%, var(--medium-gray) 100%);
          color: var(--text-primary);
          min-height: 100vh;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .logo {
          font-size: 3rem;
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .message {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .action-button {
          background: linear-gradient(45deg, var(--accent-color), var(--accent-light));
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }

        @media (max-width: 768px) {
          .container { padding: 1rem; }
          .logo { font-size: 2.5rem; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 class="logo">QShare</h1>
        <p class="message">No files are currently shared</p>
        <a href="/" class="action-button">Share Files</a>
      </div>
    </body>
    </html>`);
  }

  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shared Files - QShare</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --accent-color: #6366F1;
        --accent-light: #8B5CF6;
        --accent-subtle: rgba(99, 102, 241, 0.1);
        --light-bg: #FFFFFF;
        --light-gray: #F8F9FA;
        --medium-gray: #E9ECEF;
        --dark-gray: #495057;
        --text-primary: #212529;
        --text-secondary: #6C757D;
        --border-color: #DEE2E6;
        --success: #28A745;
        --shadow: rgba(0, 0, 0, 0.1);
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, var(--light-gray) 0%, var(--medium-gray) 100%);
        color: var(--text-primary);
        min-height: 100vh;
        overflow-x: hidden;
      }

      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
      }

      .header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .logo {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--accent-color);
        margin-bottom: 0.5rem;
        letter-spacing: -0.02em;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 1.1rem;
        font-weight: 400;
      }

      .files-section {
        background: var(--light-bg);
        border-radius: 16px;
        padding: 2rem;
        border: 1px solid var(--border-color);
        margin-bottom: 2rem;
        box-shadow: 0 2px 16px var(--shadow);
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .section-title::before {
        content: '';
        width: 4px;
        height: 20px;
        background: var(--accent-color);
        border-radius: 2px;
      }

      .file-list {
        list-style: none;
        padding: 0;
        margin-bottom: 2rem;
      }

      .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: var(--accent-subtle);
        border-radius: 12px;
        margin-bottom: 0.75rem;
        border: 1px solid rgba(99, 102, 241, 0.2);
        transition: all 0.2s ease;
        box-shadow: 0 1px 4px var(--shadow);
      }

      .file-item:hover {
        background: rgba(99, 102, 241, 0.15);
        transform: translateY(-1px);
      }

      .file-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
        min-width: 0;
      }

      .file-icon {
        font-size: 1.5rem;
        color: var(--accent-color);
        flex-shrink: 0;
      }

      .file-details {
        min-width: 0;
        flex: 1;
      }

      .file-name {
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 0.25rem;
        word-break: break-word;
      }

      .file-size {
        font-size: 0.85rem;
        color: var(--text-secondary);
      }

      .file-actions {
        flex-shrink: 0;
      }

      .download-link {
        background: linear-gradient(45deg, var(--accent-color), var(--accent-light));
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        font-size: 0.9rem;
        font-weight: 600;
      }

      .action-button.secondary:hover {
        background: rgba(255, 255, 255, 0.8);
      }

      @media (max-width: 768px) {
        .container { padding: 1rem; }
        .logo { font-size: 2rem; }
        .files-section { padding: 1.5rem; }
        .file-item { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
        .file-actions { align-self: stretch; text-align: center; }
        .actions-section { flex-direction: column; align-items: center; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header class="header">
        <h1 class="logo">QShare</h1>
        <p class="subtitle">Access your shared files</p>
      </header>

      <div class="files-section">
        <h2 class="section-title">Shared Files (${sharedFiles.length})</h2>
        <ul class="file-list">`;
  sharedFiles.forEach(file => {
    const icon = getFileIcon(file.mimetype);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`;
    html += `
          <li class="file-item">
            <div class="file-info">
              <span class="file-icon">${icon}</span>
              <div class="file-details">
                <div class="file-name">${escapeHtml(file.name)}</div>
                <div class="file-size">${sizeStr}</div>
              </div>
            </div>
            <div class="file-actions">
              <a href="/file/${encodeURIComponent(file.name)}" class="download-link">Download</a>
            </div>
          </li>`;
  });
  html += `
        </ul>
      </div>

      <div class="actions-section">
        <a href="/download-all" class="action-button">Download All Files</a>
        <a href="/" class="action-button secondary">Share More Files</a>
      </div>
    </div>
  </body>
  </html>`;
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
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Files Shared - QShare</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        :root {
          --accent-color: #6366F1;
          --accent-light: #8B5CF6;
          --accent-subtle: rgba(99, 102, 241, 0.1);
          --light-bg: #FFFFFF;
          --light-gray: #F8F9FA;
          --medium-gray: #E9ECEF;
          --dark-gray: #495057;
          --text-primary: #212529;
          --text-secondary: #6C757D;
          --border-color: #DEE2E6;
          --success: #28A745;
          --shadow: rgba(0, 0, 0, 0.1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, var(--light-gray) 0%, var(--medium-gray) 100%);
          color: var(--text-primary);
          min-height: 100vh;
          overflow-x: hidden;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent-color);
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          font-weight: 400;
        }

        .success-section {
          background: var(--light-bg);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          border: 1px solid var(--border-color);
          margin-bottom: 2rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 2px 16px var(--shadow);
        }

        .success-icon {
          font-size: 3rem;
          color: var(--success);
          margin-bottom: 1rem;
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .file-list {
          list-style: none;
          padding: 0;
          margin-bottom: 2rem;
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: var(--accent-subtle);
          border-radius: 8px;
          margin-bottom: 0.5rem;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .file-icon {
          font-size: 1.25rem;
          color: var(--accent-color);
        }

        .file-name {
          font-weight: 500;
          color: var(--text-primary);
          flex: 1;
        }

        .qr-section {
          background: var(--light-bg);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          border: 1px solid var(--border-color);
          margin-bottom: 2rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 2px 16px var(--shadow);
        }

        .qr-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .qr-code {
          margin: 1rem 0;
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .qr-instruction {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 1rem;
        }

        .actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-button {
          background: linear-gradient(45deg, var(--accent-color), var(--accent-light));
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.4);
        }

        .action-button.secondary {
          background: var(--light-bg);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .action-button.secondary:hover {
          background: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 768px) {
          .container { padding: 1rem; }
          .logo { font-size: 2rem; }
          .success-section, .qr-section { padding: 1.5rem; }
          .actions { flex-direction: column; align-items: center; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <h1 class="logo">QShare</h1>
          <p class="subtitle">Files shared successfully!</p>
        </header>

        <div class="success-section">
          <div class="success-icon">✓</div>
          <h2 class="success-title">Files Shared Successfully</h2>
          <ul class="file-list">`;
    sharedFiles.forEach(file => {
      const icon = getFileIcon(file.mimetype);
      html += `<li class="file-item">
        <span class="file-icon">${icon}</span>
        <span class="file-name">${escapeHtml(file.name)}</span>
      </li>`;
    });
    html += `</ul>
        </div>

        <div class="qr-section">
          <h3 class="qr-title">Scan QR Code to Download</h3>
          <img src="${dataUrl}" alt="QR Code" class="qr-code">
          <p class="qr-instruction">Scan this QR code with your mobile device to access and download the shared files.</p>
        </div>

        <div class="actions">
          <a href="/files" class="action-button">View Shared Files</a>
          <a href="/" class="action-button secondary">Share More Files</a>
        </div>
      </div>
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
