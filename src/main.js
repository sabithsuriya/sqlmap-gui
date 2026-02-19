const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;
let currentProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    frame: false,
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    title: 'SQLMap GUI — AI Powered',
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── Window Controls ───────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// ─── SQLMap Execution ──────────────────────────────────────────────────────────
ipcMain.handle('sqlmap-run', async (event, args) => {
  if (currentProcess) {
    currentProcess.kill();
    currentProcess = null;
  }

  return new Promise((resolve) => {
    const logPath = path.join(os.tmpdir(), `sqlmap_${Date.now()}.log`);
    const logStream = fs.createWriteStream(logPath);

    const sqlmapPath = 'sqlmap'; // assumes sqlmap is in PATH
    const proc = spawn(sqlmapPath, args, { shell: true });
    currentProcess = proc;

    let output = '';

    proc.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      logStream.write(chunk);
      mainWindow.webContents.send('sqlmap-output', { type: 'stdout', data: chunk });
    });

    proc.stderr.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      mainWindow.webContents.send('sqlmap-output', { type: 'stderr', data: chunk });
    });

    proc.on('close', (code) => {
      logStream.end();
      currentProcess = null;
      mainWindow.webContents.send('sqlmap-done', { code, logPath });
      resolve({ success: code === 0, output, logPath });
    });

    proc.on('error', (err) => {
      mainWindow.webContents.send('sqlmap-output', {
        type: 'error',
        data: `\n[ERROR] Could not start SQLMap: ${err.message}\nMake sure SQLMap is installed and in your PATH.\n`,
      });
      resolve({ success: false, output: err.message });
    });
  });
});

ipcMain.on('sqlmap-kill', () => {
  if (currentProcess) {
    currentProcess.kill('SIGTERM');
    currentProcess = null;
    mainWindow.webContents.send('sqlmap-output', {
      type: 'system',
      data: '\n[KILLED] Process terminated by user.\n',
    });
  }
});

// ─── File / Folder Dialogs ─────────────────────────────────────────────────────
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt', 'csv', 'xml', '*'] }],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
});

ipcMain.handle('save-session', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: `sqlmap_session_${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!result.canceled) {
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
    return result.filePath;
  }
  return null;
});

ipcMain.handle('load-session', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  });
  if (!result.canceled) {
    return JSON.parse(fs.readFileSync(result.filePaths[0], 'utf-8'));
  }
  return null;
});

ipcMain.on('open-external', (event, url) => shell.openExternal(url));

// ─── AI: Anthropic API call via main (no CORS issues) ─────────────────────────
ipcMain.handle('ai-request', async (event, { messages, system }) => {
  try {
    const https = require('https');
    const apiKey = process.env.ANTHROPIC_API_KEY || '';

    const body = JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system,
      messages,
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (parsed.content && parsed.content[0]) {
                resolve({ success: true, text: parsed.content[0].text });
              } else {
                resolve({ success: false, text: parsed.error?.message || 'Unknown error' });
              }
            } catch {
              resolve({ success: false, text: 'Failed to parse AI response' });
            }
          });
        }
      );
      req.on('error', (e) => resolve({ success: false, text: e.message }));
      req.write(body);
      req.end();
    });
  } catch (err) {
    return { success: false, text: err.message };
  }
});

ipcMain.handle('get-api-key', () => process.env.ANTHROPIC_API_KEY || '');
ipcMain.handle('set-api-key', (event, key) => {
  process.env.ANTHROPIC_API_KEY = key;
  return true;
});
