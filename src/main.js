const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');

app.commandLine.appendSwitch('enable-experimental-web-platform-features')

app.on('ready', () => {
  const browserWindow = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      worldSafeExecuteJavaScript: true,
      nodeIntegration: false, // defaults to false in electron v12
      contextIsolation: true,
      preload: __dirname + '/preload.js',
    }
  });

  //open developer console
  browserWindow.webContents.openDevTools();

  //open page
  browserWindow.loadFile('index.html');

  //device Id to connect set by renderer
  let deviceToConnect = null;

  //this function is called periodically
  const onSelectBluetoothDevice = (event, deviceList, callback) => {
    event.preventDefault();

    //All discovered devices at that time, are stored in array
    console.log(` ${JSON.stringify(deviceList)}`);
    for (let i in deviceList){
      browserWindow.webContents.send('discoverd-device', JSON.stringify(deviceList[i]));
      if(deviceToConnect !== null){
        browserWindow.webContents.removeAllListeners('select-bluetooth-device');
        console.log(`callback to: ${deviceToConnect}`)
        callback(deviceToConnect);
        //To avoid multiple callback call, reset to null
        deviceToConnect = null;
      }
    }
  }

  //set listener for callback
  ipcMain.on('scan', (event, arg) => {
    console.log("scan")
    browserWindow.webContents.removeAllListeners('select-bluetooth-device');
    browserWindow.webContents.on('select-bluetooth-device', onSelectBluetoothDevice);
  })

  //receive deviceId to connect from renderer
  ipcMain.on('connectDeviceId', (event, arg) => {
    console.log(`trying to connect device: ${arg}`)
    deviceToConnect = arg;
  })
});