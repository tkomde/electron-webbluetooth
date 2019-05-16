const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

app.commandLine.appendSwitch('enable-experimental-web-platform-features')

app.on('ready', () => {
  const browserWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true //as it changed default in electron5
    }
  });

  // open developer console
  browserWindow.webContents.openDevTools();

  // open page
  browserWindow.loadFile('index.html');

  const onSBDscanOnly =  (event, deviceList, callback) => {
    event.preventDefault();
    console.log(JSON.stringify(deviceList));
    let result = deviceList.find((device) => {
      browserWindow.webContents.send('discoverd-device', JSON.stringify(device));
      return;// device.deviceId === "C0:C2:98:5A:93:0E"
    })

    //call requestDevice twice automatically cancel former one. no need to send callback.
    //ipcMain.on('stop-scan', (event, arg) => {
    //  callback('');
    //})
  }

  ipcMain.on('scan-only', (event, arg) => {
    browserWindow.webContents.on('select-bluetooth-device', onSBDscanOnly);
    console.log("scan only")
  })

  const onSBDscanAndConnect =  (event, deviceList, callback) => {
    event.preventDefault();
    console.log(JSON.stringify(deviceList));
    let result = deviceList.find((device) => {
      browserWindow.webContents.send('discoverd-device', JSON.stringify(device));
      return device.deviceId === "C0:C2:98:5A:93:0E"
    })

    if (!result) {
      //callback(''); this emits cancel of requestDevice
    } else {
      callback(result.deviceId);
    }
  }

  ipcMain.on('scan-and-connect', (event, arg) => {
    browserWindow.webContents.removeListener('select-bluetooth-device', onSBDscanOnly);
    browserWindow.webContents.on('select-bluetooth-device', onSBDscanAndConnect);
    console.log("scan and connect")
  })

  
});