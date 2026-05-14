// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (data) => ipcRenderer.send('to-main', data),
  onMessage: (callback) => ipcRenderer.on('from-main', (_event, value) => callback(value))
});
