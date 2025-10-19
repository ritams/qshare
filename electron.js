const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.ELECTRON_IS_DEV === 'true';

let mainWindow = null;
let serverProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default',
    minimizable: true,
    maximizable: true,
    closable: true,
    resizable: true,
    icon: require('fs').existsSync(path.join(__dirname, 'src/assets/icon.png'))
      ? path.join(__dirname, 'src/assets/icon.png')
      : undefined,
    title: 'QShare - File Sharing'
  });

  // Load the web app
  if (isDev) {
    // Wait a moment for server to start, then load
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 2000); // Give server time to start
  } else {
    // In production, serve static files
    mainWindow.loadFile(path.join(__dirname, 'src/select.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle window close - quit the app
  mainWindow.on('closed', () => {
    mainWindow = null;
    stopServer();
    app.quit();
  });
}

function startServer() {
  // Start the Express server
  const serverPath = path.join(__dirname, 'src/index.js');
  serverProcess = spawn('bun', [serverPath], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, PORT: '3000' }
  });

  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

app.whenReady().then(() => {
  // Set app name for macOS
  app.setName('QShare');

  // Start the Express server
  startServer();

  // Create main window
  createWindow();

  // macOS specific - recreate window if all windows are closed
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopServer();
    app.quit();
  }
});
