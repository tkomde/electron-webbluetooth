const { contextBridge, ipcRenderer} = require("electron");
contextBridge.exposeInMainWorld(
  "api", {
    send: (channel, data) => { // from renderer to main
      ipcRenderer.send(channel, data);
    },
    on: (channel, func) => { // from main to renderer
      ipcRenderer.on(channel, (event, arg) => func(arg));
    }   
  }
);