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

  let deviceToConnect = null;

  //This function is called periodically
  const onSelectBluetoothDevice = (event, deviceList, callback) => {
    event.preventDefault();
    //all discovered devices are arrayied
    console.log(` ${JSON.stringify(deviceList)}`);

    for (let i in deviceList){
      browserWindow.webContents.send('discoverd-device', JSON.stringify(deviceList[i]));
      if(deviceToConnect !== null){
        browserWindow.webContents.removeAllListeners('select-bluetooth-device');
        console.log(`callback to: ${deviceToConnect}`)
        callback(deviceToConnect);
        //To avoid multiple callbacl call, reset to null
        deviceToConnect = null;
      }
    }
   }

  ipcMain.on('scan', (event, arg) => {
    console.log("scan")
    browserWindow.webContents.removeAllListeners('select-bluetooth-device');
    browserWindow.webContents.on('select-bluetooth-device', onSelectBluetoothDevice);
  })

  //specify device to connect from renderer
  ipcMain.on('connect', (event, arg) => {
    console.log(`trying to connect: ${arg}`)
    deviceToConnect = arg;
  })

});