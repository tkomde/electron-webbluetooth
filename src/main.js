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
    //console.log(JSON.stringify(deviceList));
    let result = deviceList.find((device) => {
      browserWindow.webContents.send('discoverd-device', JSON.stringify(device));
      return;
    })

    //call requestDevice twice automatically cancel former one. no need to send callback.
    //ipcMain.on('stop-scan', (event, arg) => {
    //  callback('');
    //})
  }

  ipcMain.on('scan-only', (event, arg) => {
    console.log("scan only")
    browserWindow.webContents.removeAllListeners('select-bluetooth-device');
    browserWindow.webContents.on('select-bluetooth-device', onSBDscanOnly);
  })

  let deviceToConnect;
  const onSBDscanAndConnect =  (event, deviceList, callback) => {
    event.preventDefault();
    //console.log(JSON.stringify(deviceList));
    let result = deviceList.find((device) => {
      //browserWindow.webContents.send('discoverd-device', JSON.stringify(device));
      return device.deviceId === deviceToConnect;
    })

    if (result) {
      callback(result.deviceId);
    }
  }

  ipcMain.on('scan-and-connect', (event, arg) => {
    console.log(`scan and connect to ${arg}`)
    deviceToConnect = arg;
    //To call different callback, delete former callback
    browserWindow.webContents.removeAllListeners('select-bluetooth-device');
    browserWindow.webContents.on('select-bluetooth-device', onSBDscanAndConnect);
  })

});