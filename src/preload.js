const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sqlmapAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // SQLMap
  run: (args) => ipcRenderer.invoke('sqlmap-run', args),
  kill: () => ipcRenderer.send('sqlmap-kill'),
  onOutput: (cb) => ipcRenderer.on('sqlmap-output', (_, data) => cb(data)),
  onDone: (cb) => ipcRenderer.on('sqlmap-done', (_, data) => cb(data)),
  removeOutputListeners: () => {
    ipcRenderer.removeAllListeners('sqlmap-output');
    ipcRenderer.removeAllListeners('sqlmap-done');
  },

  // Dialogs & Files
  openFile: () => ipcRenderer.invoke('open-file-dialog'),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  readFile: (p) => ipcRenderer.invoke('read-file', p),
  saveSession: (data) => ipcRenderer.invoke('save-session', data),
  loadSession: () => ipcRenderer.invoke('load-session'),
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // AI
  aiRequest: (payload) => ipcRenderer.invoke('ai-request', payload),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (key) => ipcRenderer.invoke('set-api-key', key),
});
