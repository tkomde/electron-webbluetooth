const {ipcRenderer} = require('electron')
ipcRenderer.on('discoverd-device', (event, message) => {
  console.log(message) // Prints device
})

const emitDeviceId = () => {
  ipcRenderer.send('connect-device-id', '28:A1:83:05:86:E7')  
}

// 2018-09-10 ver. 0.5.0 Calibの追加とES6記法への移行
// 2018-09-26 ver. 0.6.0 コマンドのWebAssembly化
// 2018-11-05 ver. 0.7.0 storeモード確認
/* global navigator ds1 ds2 ds3 ons gb*/
let meme_device;
let meme_service;
let meme_rw_characteristics;
let meme_nr_characteristics;
const MEME_SERVICE_UUID = 'd6f25bd1-5b54-4360-96d8-7aa62e04c7ef';
const MEME_RW_CHARACTERISTIC_UUID = 'd6f25bd2-5b54-4360-96d8-7aa62e04c7ef';
const MEME_NR_CHARACTERISTIC_UUID = 'd6f25bd4-5b54-4360-96d8-7aa62e04c7ef';

let dcnt = 0;
let rtcnt = 1;

let app = {};

let memecom;

let hw_info = {model_main: null, model_sub: null, version: null};
let fw_info = {str: null, major: null, minor: null, revision: null};

//モードの記録
let meme_mode = 'ini';
//STDデータのACK用
let latest_ts = new Uint8Array(5);
//RTデータのlocal storageへのストア、packetは
let enable_rt_store = false;
let lc_storage = localStorage;
let rt_store = {ts:[], packet:[]};

ons.ready( () => {
  ons.createElement('action-sheet.html', { append: true })
    .then( (sheet) =>  {
      app.showCommandIssue = sheet.show.bind(sheet);
      app.hideCommandIssue = sheet.hide.bind(sheet);
    });

  //WASM scriptのロード
  /*fetch('memecom.wasm').then(response =>
    response.arrayBuffer()
  ).then(bytes =>
    WebAssembly.instantiate(bytes)
  ).then(result =>
    memecom = result.instance.exports
  );*/
  
  //ファイルに埋め込むバージョン
  const wasm_buff = new Uint8Array([0,97,115,109,1,0,0,0,1,25,5,96,0,1,127,96,2,127,127,1,125,96,2,127,127,1,127,96,1,127,1,127,96,0,0,3,28,27,0,2,1,1,1,1,1,1,3,2,2,2,3,3,3,3,3,3,3,3,3,3,3,3,2,2,4,4,5,1,112,1,1,1,5,3,1,0,1,6,36,7,127,0,65,40,11,127,1,65,0,11,127,0,65,3,11,127,0,65,8,11,127,0,65,7,11,127,0,65,8,11,127,0,65,48,11,7,249,2,26,6,109,101,109,111,114,121,2,0,5,97,100,100,101,114,0,0,7,114,116,95,97,99,99,88,0,2,7,114,116,95,97,99,99,89,0,3,7,114,116,95,97,99,99,90,0,4,7,114,116,95,114,111,108,108,0,5,8,114,116,95,112,105,116,99,104,0,6,6,114,116,95,121,97,119,0,7,13,114,116,95,98,108,105,110,107,83,112,101,101,100,0,8,16,114,116,95,98,108,105,110,107,83,116,114,101,110,103,116,104,0,9,12,100,101,118,73,110,102,111,77,111,100,101,108,0,10,15,100,101,118,73,110,102,111,77,111,100,101,108,83,117,98,0,11,11,114,116,95,102,105,116,69,114,114,111,114,0,12,10,114,116,95,119,97,108,107,105,110,103,0,13,14,114,116,95,110,111,105,115,101,83,116,97,116,117,115,0,14,12,114,116,95,112,111,119,101,114,76,101,102,116,0,15,12,114,116,95,101,121,101,77,111,118,101,85,112,0,16,14,114,116,95,101,121,101,77,111,118,101,68,111,119,110,0,17,14,114,116,95,101,121,101,77,111,118,101,76,101,102,116,0,18,15,114,116,95,101,121,101,77,111,118,101,82,105,103,104,116,0,19,14,114,116,95,101,121,101,77,111,118,101,85,112,71,51,0,20,16,114,116,95,101,121,101,77,111,118,101,68,111,119,110,71,51,0,21,16,114,116,95,101,121,101,77,111,118,101,76,101,102,116,71,51,0,22,17,114,116,95,101,121,101,77,111,118,101,82,105,103,104,116,71,51,0,23,13,100,101,99,114,121,112,116,83,105,110,103,108,101,0,24,11,99,114,121,112,116,83,105,110,103,108,101,0,25,9,7,1,0,65,0,11,1,26,10,247,10,27,15,0,35,1,65,1,106,65,255,1,113,36,1,35,1,11,38,1,1,127,32,0,40,2,0,33,2,32,1,32,2,40,2,0,65,0,118,73,4,127,32,2,32,1,65,0,116,106,45,0,8,5,0,11,11,104,2,3,127,1,125,32,0,65,12,107,35,0,65,12,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,15,107,35,0,65,15,16,1,65,255,1,113,115,65,255,1,113,33,3,32,2,65,16,108,32,3,65,15,113,106,33,4,32,4,65,128,16,113,65,0,75,4,125,32,4,179,67,0,0,128,69,147,67,0,0,128,65,149,5,32,4,179,67,0,0,128,65,149,11,33,5,32,5,11,104,2,3,127,1,125,32,0,65,13,107,35,0,65,13,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,15,107,35,0,65,15,16,1,65,255,1,113,115,65,255,1,113,33,3,32,2,65,16,108,32,3,65,4,118,106,33,4,32,4,65,128,16,113,65,0,75,4,125,32,4,179,67,0,0,128,69,147,67,0,0,128,65,149,5,32,4,179,67,0,0,128,65,149,11,33,5,32,5,11,104,2,3,127,1,125,32,0,65,14,107,35,0,65,14,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,16,107,35,0,65,16,16,1,65,255,1,113,115,65,255,1,113,33,3,32,2,65,16,108,32,3,65,15,113,106,33,4,32,4,65,128,16,113,65,0,75,4,125,32,4,179,67,0,0,128,69,147,67,0,0,128,65,149,5,32,4,179,67,0,0,128,65,149,11,33,5,32,5,11,103,2,3,127,1,125,32,0,65,6,107,35,0,65,6,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,7,107,35,0,65,7,16,1,65,255,1,113,115,65,255,1,113,33,3,32,3,65,128,2,108,32,2,106,33,4,32,4,65,128,128,2,113,65,0,75,4,125,32,4,179,67,0,0,128,71,147,67,0,0,200,66,149,5,32,4,179,67,0,0,200,66,149,11,33,5,32,5,11,103,2,3,127,1,125,32,0,65,8,107,35,0,65,8,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,9,107,35,0,65,9,16,1,65,255,1,113,115,65,255,1,113,33,3,32,3,65,128,2,108,32,2,106,33,4,32,4,65,128,128,2,113,65,0,75,4,125,32,4,179,67,0,0,128,71,147,67,0,0,200,66,149,5,32,4,179,67,0,0,200,66,149,11,33,5,32,5,11,74,2,3,127,1,125,32,0,65,10,107,35,0,65,10,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,11,107,35,0,65,11,16,1,65,255,1,113,115,65,255,1,113,33,3,32,3,65,128,2,108,32,2,106,33,4,32,4,179,67,0,0,200,66,149,33,5,32,5,11,36,1,1,127,32,0,65,3,107,35,0,65,3,16,1,65,255,1,113,115,65,255,1,113,65,10,108,33,1,32,1,65,255,255,3,113,11,66,1,3,127,32,0,65,4,107,35,0,65,4,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,5,107,35,0,65,5,16,1,65,255,1,113,115,65,255,1,113,33,3,32,3,65,128,2,108,32,2,106,33,4,32,4,65,255,255,3,113,11,72,1,4,127,32,0,65,0,107,35,0,65,0,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,1,107,35,0,65,1,16,1,65,255,1,113,115,65,255,1,113,33,3,32,3,65,128,2,108,32,2,106,33,4,32,4,65,192,31,113,65,6,118,33,5,32,5,11,68,1,4,127,32,0,65,0,107,35,0,65,0,16,1,65,255,1,113,115,65,255,1,113,33,2,32,1,65,1,107,35,0,65,1,16,1,65,255,1,113,115,65,255,1,113,33,3,32,3,65,128,2,108,32,2,106,33,4,32,4,65,63,113,33,5,32,5,11,27,1,1,127,32,0,65,0,107,35,0,65,0,16,1,115,65,255,1,113,65,3,113,33,1,32,1,11,30,1,1,127,32,0,65,0,107,35,0,65,0,16,1,115,65,255,1,113,65,2,118,65,1,113,33,1,32,1,11,30,1,1,127,32,0,65,0,107,35,0,65,0,16,1,115,65,255,1,113,65,3,118,65,1,113,33,1,32,1,11,27,1,1,127,32,0,65,0,107,35,0,65,0,16,1,115,65,255,1,113,65,4,118,33,1,32,1,11,27,1,1,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,65,3,113,33,1,32,1,11,30,1,1,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,65,2,118,65,3,113,33,1,32,1,11,30,1,1,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,65,4,118,65,3,113,33,1,32,1,11,27,1,1,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,65,6,118,33,1,32,1,11,47,1,2,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,33,1,32,1,65,3,118,65,1,113,65,1,115,32,1,65,7,113,108,33,2,32,2,65,255,1,113,11,44,1,2,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,33,1,32,1,65,3,118,65,1,113,32,1,65,7,113,108,33,2,32,2,65,255,1,113,11,44,1,2,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,33,1,32,1,65,7,118,32,1,65,4,118,65,7,113,108,33,2,32,2,65,255,1,113,11,47,1,2,127,32,0,65,2,107,35,0,65,2,16,1,115,65,255,1,113,33,1,32,1,65,7,118,65,1,115,32,1,65,4,118,65,7,113,108,33,2,32,2,65,255,1,113,11,34,1,1,127,32,0,32,1,65,2,107,107,35,0,32,1,65,2,107,65,255,1,113,16,1,115,65,255,1,113,33,2,32,2,11,38,1,1,127,32,0,65,255,1,113,35,0,32,1,65,2,107,65,255,1,113,16,1,115,32,1,106,65,2,107,65,255,1,113,33,2,32,2,11,2,0,11,11,51,2,0,65,8,11,32,18,0,0,0,0,0,0,0,157,126,61,104,123,103,149,248,128,102,187,169,84,55,210,120,246,154,0,0,0,0,0,0,0,65,40,11,8,8,0,0,0,18,0,0,0,0,201,4,4,110,97,109,101,1,193,4,27,0,13,109,101,109,101,99,111,109,47,97,100,100,101,114,1,26,126,108,105,98,47,97,114,114,97,121,47,65,114,114,97,121,60,117,56,62,35,95,95,103,101,116,2,15,109,101,109,101,99,111,109,47,114,116,95,97,99,99,88,3,15,109,101,109,101,99,111,109,47,114,116,95,97,99,99,89,4,15,109,101,109,101,99,111,109,47,114,116,95,97,99,99,90,5,15,109,101,109,101,99,111,109,47,114,116,95,114,111,108,108,6,16,109,101,109,101,99,111,109,47,114,116,95,112,105,116,99,104,7,14,109,101,109,101,99,111,109,47,114,116,95,121,97,119,8,21,109,101,109,101,99,111,109,47,114,116,95,98,108,105,110,107,83,112,101,101,100,9,24,109,101,109,101,99,111,109,47,114,116,95,98,108,105,110,107,83,116,114,101,110,103,116,104,10,20,109,101,109,101,99,111,109,47,100,101,118,73,110,102,111,77,111,100,101,108,11,23,109,101,109,101,99,111,109,47,100,101,118,73,110,102,111,77,111,100,101,108,83,117,98,12,19,109,101,109,101,99,111,109,47,114,116,95,102,105,116,69,114,114,111,114,13,18,109,101,109,101,99,111,109,47,114,116,95,119,97,108,107,105,110,103,14,22,109,101,109,101,99,111,109,47,114,116,95,110,111,105,115,101,83,116,97,116,117,115,15,20,109,101,109,101,99,111,109,47,114,116,95,112,111,119,101,114,76,101,102,116,16,20,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,85,112,17,22,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,68,111,119,110,18,22,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,76,101,102,116,19,23,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,82,105,103,104,116,20,22,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,85,112,71,51,21,24,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,68,111,119,110,71,51,22,24,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,76,101,102,116,71,51,23,25,109,101,109,101,99,111,109,47,114,116,95,101,121,101,77,111,118,101,82,105,103,104,116,71,51,24,21,109,101,109,101,99,111,109,47,100,101,99,114,121,112,116,83,105,110,103,108,101,25,19,109,101,109,101,99,111,109,47,99,114,121,112,116,83,105,110,103,108,101,26,4,110,117,108,108]);
  WebAssembly.instantiate(wasm_buff).then(result =>
    memecom = result.instance.exports
  );
  
  //WASMを配列に書き出す用のコード
  /*fetch('memecom.wasm').then(response =>
    response.arrayBuffer()
  ).then(bytes => {
    let buf = new Uint8Array(bytes)
    console.log(JSON.stringify(Array.from(buf)))
  });*/
  
 
  //localStorageの読み込み
  if(lc_storage.getItem('rt_store')){
    rt_store = JSON.parse(lc_storage.getItem('rt_store'));
    rtcnt = rt_store.ts.length; //カウンタのセット
    document.getElementById("rt_data_store_cnt").innerHTML = rtcnt;
  }

});

//hex <-> Uint8Array conversion
const fromHexString = hexString =>
  new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
const toHexString = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
//sum Array
const sumArray = arr => {
    return arr.reduce( (prev, current, i, arr) => {
        return prev+current;
    });
};

const status_log = str => {
  //document.getElementById("status").innerHTML = str;
  ons.notification.toast(str, { timeout: 300, animation: 'fall' })
}

let status2_buffer = ['','',''];
const status2_log = str => {
  status2_buffer.push(str);
  status2_buffer.shift();
  document.getElementById("status2").innerHTML = status2_buffer[0] + "<br />" + status2_buffer[1] + "<br />" + status2_buffer[2];
  console.log(str);
  //ons.notification.toast(str, { timeout: 700, animation: 'fall' })
}

// Scan開始して
const startScan = () => {
    status_log("Connecting to device");
    navigator.bluetooth.requestDevice({
      filters: [{
        services: [MEME_SERVICE_UUID] //only small char-case
      }]
    })
  .then(device => {
    meme_device = device;
    console.log("device", device);
    status_log("Connected to device");
    meme_device.addEventListener('gattserverdisconnected', onDisconnected);
    return device.gatt.connect();
  })
  .then(server =>{
    console.log("server", server)
    status_log("Connected to GATT server");
    return server.getPrimaryService(MEME_SERVICE_UUID);
  })
  .then(service => {
    console.log("service", service)
    meme_service = service;
    return Promise.all([
      meme_service.getCharacteristic(MEME_NR_CHARACTERISTIC_UUID)
        .then(characteristic => {
          meme_nr_characteristics = characteristic;
          meme_nr_characteristics.startNotifications();
          //ここをイベントリスナ以外でできないかな、、、
          meme_nr_characteristics.addEventListener('characteristicvaluechanged',handleNotifications);
          console.log("characteristic:", characteristic);
        }),
      meme_service.getCharacteristic(MEME_RW_CHARACTERISTIC_UUID)
        .then(characteristic => {
        meme_rw_characteristics = characteristic;
        console.log("characteristic:", characteristic);
      })
    ])
  })
  .then( () => {
    status_log("Completed BLE connection");
    //コマンド発行の時は念のためウェイトかける
    //setTimeout(setMemeMode('07'), 700);//To RT
  })
  .catch(error => {
    console.log(`error: ${error}`);
  });
}

const onDisconnected = () => {
  status_log('Bluetooth Device disconnected from device.');
}

const disconnectWithMeme = () => {
  if (!meme_device || !meme_device.gatt.connected) return ;
  meme_device.gatt.disconnect();
  status_log("Disconnected with BLE device")
}

// コマンド発行群
const getMemeDevInfo = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142100')));
}
const getMemeSetTime = () => {
  const date_now = Math.floor(Date.now() / 1000);
  let na = new Uint8Array(5);
  na[0] = date_now & 0x00000000ff;
  na[1] = (date_now >>> 8) & 0x00000000ff;
  na[2] = (date_now >>> 16) & 0x00000000ff;
  na[3] = (date_now >>> 24) & 0x00000000ff;
  if (date_now != (date_now >>> 32)){ //シフトしすぎると元の値に戻る、、
  	na[4] = (date_now >>> 32) & 0x00000000ff;
  } else {
  	na[4] = 0;
  }
  //ADN_SET_TIME
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('1422' + toHexString(na) )));
}
const getMemeMode = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142300')));
}
//Change mode
const setMemeMode = (arg, store = false) => {
  meme_mode = arg;
  let from_store = store ? "01" : "00";
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('1424' + arg + from_store)));
}
const startDataReport = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142001')));
}
const stopDataReport = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142000')));
}
const getCalibData1 = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142B0000')));
}
const getCalibData2 = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142B01')));
}
const setCalibData1 = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142C2D002D002D002D007800780078007800')));
}
const setCalibData2 = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142D1900190019001900')));
}
const getStoreInfo = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142600')));
}
//ADN_REPORT_RESPの値はGen1のをいったん入れたけど、TIMESTAMPが必要？？
const setStdResponse = () => {
  console.log(`setStdResponse: ${fromHexString('143F00' + toHexString(latest_ts))}`);
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('143F00' + toHexString(latest_ts))));
}
//issue DEVINFO
const getDevInfo = () => {
  meme_rw_characteristics.writeValue(cryptCommand(fromHexString('142100')));
}

let gb_swch = false;
const gb_switch = () => {
  console.log("gb_switch");
  gb_swch = true;
}

//notification handling in frequency order
const handleNotifications = event => {
  const value = event.target.value;
  let notf_data = new Uint8Array(20);
  //index2からcryptされているので
  for (let i = 0; i < 20; i++) {
    notf_data[i] = value.getUint8(i);
  }
  //AUP_REPORT_RT, detect first because this data is large
  if(notf_data[0] == 20 && (notf_data[1] == 24)){
    const data = {
      blinkSpeed: memecom.rt_blinkSpeed(notf_data[5]),
      blinkStrength: memecom.rt_blinkStrength(notf_data[6],notf_data[7]),
      roll: memecom.rt_roll(notf_data[8],notf_data[9]),
      pitch: memecom.rt_pitch(notf_data[10],notf_data[11]),
      yaw: memecom.rt_yaw(notf_data[12],notf_data[13]),
      accX: memecom.rt_accX(notf_data[14],notf_data[17]),
      accY: memecom.rt_accY(notf_data[15],notf_data[17]),
      accZ: memecom.rt_accZ(notf_data[16],notf_data[18]),
      fitError: memecom.rt_fitError(notf_data[2]),
      walking: memecom.rt_walking(notf_data[2]),
      noiseStatus: memecom.rt_noiseStatus(notf_data[2]),
      powerLeft: memecom.rt_powerLeft(notf_data[2]),
      eyeMoveUp: memecom.rt_eyeMoveUp(notf_data[4]),
      eyeMoveDown: memecom.rt_eyeMoveDown(notf_data[4]),
      eyeMoveLeft: memecom.rt_eyeMoveLeft(notf_data[4]),
      eyeMoveRight: memecom.rt_eyeMoveRight(notf_data[4]),
      eyeMoveUpG3: memecom.rt_eyeMoveUpG3(notf_data[4]),
      eyeMoveDownG3: memecom.rt_eyeMoveDownG3(notf_data[4]),
      eyeMoveLeftG3: memecom.rt_eyeMoveLeftG3(notf_data[4]),
      eyeMoveRightG3: memecom.rt_eyeMoveRightG3(notf_data[4]),
    };
    //callback
    realtimeData(data);
    
  	//データストア
    if(enable_rt_store && rtcnt < 72000){
      rt_store.ts.push(Date.now());
      rt_store.packet.push(toHexString(notf_data).slice(4, -2));
	    if(rtcnt % 200 == 0){ //適度な間隔で
        lc_storage.setItem('rt_store', JSON.stringify(rt_store));
        document.getElementById("rt_data_store_cnt").innerHTML = `Stored RT rows: ${rt_store.ts.length}`;
    	}
    }
    rtcnt++;
  //AUP_REPORT_STD_1
  } else if(notf_data[0] == 20 && notf_data[1] == 16){
    const decrypted_hex = toHexString(decryptCommand(notf_data));
    const std1_data = decodeSTD1(decrypted_hex);
    
    status2_log(`AUP_REPORT_STD1: ${std1_data.date} ${decrypted_hex}`);
    stdraw_csv_contents += '"' + meme_mode + '",' + std1_data.ut + ',' + std1_data.date + ',"' + decrypted_hex + '","';
  //AUP_REPORT_STD_2
  } else if(notf_data[0] == 20 && notf_data[1] == 17){
    const decrypted_hex = toHexString(decryptCommand(notf_data));
    const std2_data = decodeSTD2(decrypted_hex);
    
    console.log(`tl_yav: ${std2_data.tl_yav} tl_xav: ${std2_data.tl_xav}`);
    stdraw_csv_contents += decrypted_hex + '","';
  //AUP_REPORT_STD_3
  } else if(notf_data[0] == 20 && notf_data[1] == 18){
    //status2_log(`AUP_REPORT_STD3`);
    stdraw_csv_contents += toHexString(decryptCommand(notf_data)) + '"\n';
  //AUP_REPORT_STORE_INFO
  } else if(notf_data[0] == 20 && notf_data[1] == 6){
    let newest_ts = new Uint8Array(5);
    let oldest_ts = new Uint8Array(5);
    const buffer_n = memecom.decryptSingle(notf_data[2], 2) + memecom.decryptSingle(notf_data[3], 3) * 2 ** 8 ;
    for (let i=0;i<5;i++){
      newest_ts[i] = memecom.decryptSingle(notf_data[i+4], i+4);
      oldest_ts[i] = memecom.decryptSingle(notf_data[i+9], i+9);
    }
    const newest_ut = newest_ts[0] + newest_ts[1] * 2 ** 8 + newest_ts[2] * 2 ** 16 +
      newest_ts[3] * 2 ** 24 + newest_ts[4] * 2 ** 32;
    const oldest_ut = oldest_ts[0] + oldest_ts[1] * 2 ** 8 + oldest_ts[2] * 2 ** 16 +
      oldest_ts[3] * 2 ** 24 + oldest_ts[4] * 2 ** 32;
    const newest_date = new Date(newest_ut * 1000);
    const oldest_date = new Date(oldest_ut * 1000);
    status2_log(`AUP_REPORT_STORE_INFO: buffer_n:${buffer_n} newest:${newest_date.toISOString()} oldest:${oldest_date.toISOString()} ${toHexString(decryptCommand(notf_data))}`);
  //AUP_REPORT_STORE_RESULT
  } else if(notf_data[0] == 20 && notf_data[1] == 7){
      meme_mode = '03';//強制的にここに戻るので
      status2_log(`AUP_REPORT_STORE_RESULT: ${toHexString(decryptCommand(notf_data))}`)
  //AUP_REPORT_RESP
  } else if(notf_data[0] == 20 && notf_data[1] == 15){
    //ACK
    if(memecom.decryptSingle(notf_data[2], 2) == 0){
      status_log(`Command OK: ${memecom.decryptSingle(notf_data[3], 3)}`)
      status2_log(`AUP_REPORT_RESP:OK Code:0x${memecom.decryptSingle(notf_data[3], 3).toString(16)} Mode:0x${memecom.decryptSingle(notf_data[4], 4).toString(16)} ${toHexString(decryptCommand(notf_data))}`)
    } else { //NACK
      status_log(`Command NG: ${memecom.decryptSingle(notf_data[3], 3)}`)
      status2_log(`AUP_REPORT_RESP:NG Code:0x${memecom.decryptSingle(notf_data[3], 3).toString(16)} Mode:0x${memecom.decryptSingle(notf_data[4], 4).toString(16)} ${toHexString(decryptCommand(notf_data))}`)
    }
  //AUP_REPORT_DEV_INFO
  } else if(notf_data[0] == 20 && notf_data[1] == 1){
    status2_log(`AUP_REPORT_DEV_INFO ${toHexString(decryptCommand(notf_data))}`)
    hw_info = {model_main: memecom.devInfoModel(notf_data[2], notf_data[3]),
      model_sub: memecom.devInfoModelSub(notf_data[2], notf_data[3]),
      version: memecom.decryptSingle(notf_data[7], 7)
    };
    fw_info.major = memecom.decryptSingle(notf_data[6], 6);
    fw_info.minor = memecom.decryptSingle(notf_data[5], 5);
    fw_info.revision = memecom.decryptSingle(notf_data[4], 4);
    fw_info.str = `${fw_info.major}.${fw_info.minor}.${fw_info.revision}`;
    status2_log(`hwver: ${JSON.stringify(hw_info)} / fwver ${JSON.stringify(fw_info)}`);
  //AUP_REPORT_MODE
  } else if(notf_data[0] == 20 && notf_data[1] == 3){
      status2_log(`AUP_REPORT_MODE: Mode:0x${memecom.decryptSingle(notf_data[2], 2).toString(16)} ${toHexString(decryptCommand(notf_data))}`)
  } else {
    //status2_log(toHexString(notf_data));
    status2_log(`OTHER Notification: ${toHexString(decryptCommand(notf_data))}`);
  }
}

const realtimeData = data => {
	//chart
	ds1[0].data.push(data.roll)
	ds1[0].data.shift();
	ds1[1].data.push(data.pitch);
	ds1[1].data.shift();
	ds1[2].data.push(data.yaw - 180);
	ds1[2].data.shift();

	ds2[0].data.push(data.accX);
	ds2[0].data.shift();
	ds2[1].data.push(data.accY);
	ds2[1].data.shift();
	ds2[2].data.push(data.accZ);
	ds2[2].data.shift();
	ds3[0].data.push(data.blinkStrength);
	//ds3[1].data.push(-50 * data.eyeMoveDown + 50 * data.eyeMoveUp + 50);
	//ds3[2].data.push(-50 * data.eyeMoveLeft + 50 * data.eyeMoveRight - 50);
	ds3[1].data.push(-20 * data.eyeMoveDownG3 + 20 * data.eyeMoveUpG3 + 50);
	ds3[2].data.push(-20 * data.eyeMoveLeftG3 + 20 * data.eyeMoveRightG3 - 50);
	ds3[3].data.push(-130 + 60 * data.walking);
	ds3[4].data.push(-200 + 60 * data.noiseStatus);
	ds3[0].data.shift();
	ds3[1].data.shift();
	ds3[2].data.shift();
	ds3[3].data.shift();
	ds3[4].data.shift();
	
	if(dcnt % 10 == 0){ //適度に間引く
	  window.scatterChart1.update();
	  window.scatterChart2.update();
	  window.scatterChart3.update();
    document.getElementById("rt_data_cnt").innerHTML = dcnt;
	}
  dcnt++;
}

//STD CSVデータ(RAW)
let stdraw_csv_contents = "mode,ut,date,packet1,packet2,packet3\n";

//STD CSVファイル保存
const handleSTDRawDownload = () => {
  const blob = new Blob([ stdraw_csv_contents ], { "type" : "text/plain" });
  document.getElementById("downloadstdrawcsv").href = window.URL.createObjectURL(blob);
}

//RT CSVファイル保存
const handleRTDownload = () => {
  let rt_csv_contents = "id,date,eyeMoveUp,eyeMoveDown,eyeMoveLeft,eyeMoveRight,blinkSpeed,blinkStrength,isWalking,roll,pitch,yaw,accX,accY,accZ,fitError,powerLeft,noiseStatus\n";
  
  for(let i=0;i<rt_store.ts.length;i++){
    const notf_data = fromHexString('0000' + rt_store.packet[i]); //パケット構造を合わせる
    rt_csv_contents += i + ',' + getDateStr(rt_store.ts[i]) +
      ',' + (memecom.rt_eyeMoveUpG3(notf_data[4]) / 2.2).toFixed(0) +
      ',' + (memecom.rt_eyeMoveDownG3(notf_data[4]) / 2.2).toFixed(0) +
      ',' + (memecom.rt_eyeMoveLeftG3(notf_data[4]) / 2.2).toFixed(0) +
      ',' + (memecom.rt_eyeMoveRightG3(notf_data[4]) / 2.2).toFixed(0) +
      ',' + memecom.rt_blinkSpeed(notf_data[5]) +
      ',' + memecom.rt_blinkStrength(notf_data[6],notf_data[7]) +
      ',' + memecom.rt_walking(notf_data[2]) +
      ',' + memecom.rt_roll(notf_data[8],notf_data[9]) +
      ',' + memecom.rt_pitch(notf_data[10],notf_data[11]) +
      ',' + memecom.rt_yaw(notf_data[12],notf_data[13]) +
      ',' + memecom.rt_accX(notf_data[14],notf_data[17]) +
      ',' + memecom.rt_accY(notf_data[15],notf_data[17]) +
      ',' + memecom.rt_accZ(notf_data[16],notf_data[18]) +
      ',' + memecom.rt_fitError(notf_data[2]) +
      ',' + memecom.rt_powerLeft(notf_data[2]) +
      ',' + memecom.rt_noiseStatus(notf_data[2]) + '\n';
  }
  const blob = new Blob([ rt_csv_contents ], { "type" : "text/plain" });
  document.getElementById("downloadrtcsv").href = window.URL.createObjectURL(blob);
}

//RTストアするかどうか
const storeRTChecked = () => {
  enable_rt_store = !enable_rt_store;
}

//RTストアクリア
const clearStoredRT = () => {
  lc_storage.removeItem('rt_store');
  document.getElementById("rt_data_store_cnt").innerHTML = 0;
  rt_store = {ts:[], packet:[]};
}

//index 2~19を暗号化するコマンド、Arrayが突っ込まれてくる
const cryptCommand = plain_array => {
  let crypted = new Uint8Array(20);
  //固定文字列
  crypted[0] = plain_array[0];
  crypted[1] = plain_array[1];
  for (let i = 2 ; i < 19 ; i++){
    crypted[i] = memecom.cryptSingle(plain_array[i], i);
  }
  //checksum(index:17)のセット
  const data_ary = plain_array.slice(2);//データ部分(2以降)を切り出し
  crypted[19] = memecom.cryptSingle(sumArray(data_ary), 19);
  return crypted;
}

//index 2~19を復号化するコマンド、Arrayが突っ込まれてくる
const decryptCommand = plain_array => {
  let decrypted = new Uint8Array(20);
  //固定文字列
  decrypted[0] = plain_array[0];
  decrypted[1] = plain_array[1];
  for (let i = 2 ; i < 20 ; i++){
    decrypted[i] = memecom.decryptSingle(plain_array[i], i);
  }
  return decrypted;
}

const getDateStr = (ts) => {
    const d = new Date(ts);
    const year  = String(d.getFullYear());
    const month = ( d.getMonth() + 1 < 10 ) ? '0' + (d.getMonth() + 1) : String(d.getMonth() + 1);
    const day  = ( d.getDate()    < 10 ) ? '0' + d.getDate() : String(d.getDate());
    const hour = ( d.getHours()   < 10 ) ? '0' + d.getHours() : String(d.getHours());
    const min  = ( d.getMinutes() < 10 ) ? '0' + d.getMinutes() : String(d.getMinutes());
    const sec  = ( d.getSeconds() < 10 ) ? '0' + d.getSeconds() : String(d.getSeconds());
    const mSec  = String(ts).slice(-3);
    return year + '/' + month + '/' + day + ' ' + hour  + ':' + min + ':' + sec + '.' + mSec;
}

//復号化済みのSTDパケットを処理する関数
const decodeSTD1 = (packet) => {
  const notf_data = fromHexString(packet);
  const meme_unixtime = notf_data[2] + notf_data[3] * 2 ** 8 + notf_data[4] * 2 ** 16 +
    notf_data[5] * 2 ** 24 + notf_data[6] * 2 ** 32;
  const meme_date = new Date(meme_unixtime * 1000);
  //status2_log(`AUP_REPORT_STD1: ${meme_date.toISOString()} ${toHexString(decryptCommand(notf_data))}`);

  const res = {
    date: '"' + meme_date.toISOString() + '"',
    ut: meme_unixtime,
    val_s: notf_data[7],
    nis_s: notf_data[8],
    wea_s: notf_data[9],
    stp_s: notf_data[10],
    bl: notf_data[11],
    ems_rl: notf_data[12],
    ems_ud: notf_data[13],
    eml_rl: notf_data[14],
    eml_ud: notf_data[15],
    hm_po: notf_data[16],
    hm_yo: notf_data[17],
    sa_xr: notf_data[18],
    sa_xl: notf_data[19]
  }
  return res;
}

const decodeSTD2 = (packet) => {
  const notf_data = fromHexString(packet);
  const tl_xav_raw = notf_data[8] + notf_data[9] * 256;
  const tl_yav_raw = notf_data[10] + notf_data[11] * 256;
  const tl_xsd_raw = notf_data[12] + notf_data[13] * 256;
  const tl_ysd_raw = notf_data[14] + notf_data[15] * 256;
  
  const res = {
    sa_yr: notf_data[2],
    sa_yl: notf_data[3],
    sa_zr: notf_data[4],
    sa_zl: notf_data[5],
    st_r: notf_data[6],
    st_l: notf_data[7],
    tl_xav: (tl_xav_raw & 0x8000) > 0 ? (tl_xav_raw - 0x10000) / 100 : tl_xav_raw / 100,
    tl_yav: (tl_yav_raw & 0x8000) > 0 ? (tl_yav_raw - 0x10000) / 100 : tl_yav_raw / 100,
    tl_xsd: (tl_xsd_raw & 0x8000) > 0 ? (tl_xsd_raw - 0x10000) / 100 : tl_xsd_raw / 100,
    tl_ysd: (tl_ysd_raw & 0x8000) > 0 ? (tl_ysd_raw - 0x10000) / 100 : tl_ysd_raw / 100,
    stp_fst: notf_data[16],
    stp_mid: notf_data[17],
    stp_slw: notf_data[18],
    stp_vsl: notf_data[19],
  }
  return res;
}

const decodeSTD3 = (packet) => {
  const notf_data = fromHexString(packet);

  const res = {
    lc_npt_av: notf_data[2],
    lc_bkw_av: notf_data[3],
    lc_bkw_sd: notf_data[4],
    lc_bkh_av: notf_data[5],
    lc_bkh_sd: notf_data[6],
    lc_bk_n: notf_data[7],
    lc_bkg_n: notf_data[8],
    lc_bki_av: notf_data[9],
    lc_bki_n: notf_data[10],
    sc_npt_av: notf_data[11],
    sc_bkw_av: notf_data[12],
    sc_bkw_sd: notf_data[13],
    sc_bkh_av: notf_data[14],
    sc_bkh_sd: notf_data[15],
    sc_bk_n: notf_data[16],
    sc_bkg_n: notf_data[17],
    sc_bki_av: notf_data[18],
    sc_bki_n: notf_data[19]
  }
  return res;
}

let stddata_csv_contents = "";
const handleSTDRawFileSelect = evt => {
    stddata_csv_contents = "date,ut,val_s,nis_s,wea_s,stp_s,bl,ems_rl,ems_ud,eml_rl,eml_ud,hm_po,hm_yo,sa_xr,sa_xl,sa_yr,sa_yl,sa_zr,sa_zl,st_r,st_l,tl_xav,tl_yav,tl_xsd,tl_ysd,stp_fst,stp_mid,stp_slw,stp_vsl,lc_npt_av,lc_bkw_av,lc_bkw_sd,lc_bkh_av,lc_bkh_sd,lc_bk_n,lc_bkg_n,lc_bki_av,lc_bki_n,sc_npt_av,sc_npt_av,sc_bkw_sd,sc_bkh_av,sc_bkh_sd,sc_bk_n,sc_bkg_n,sc_bki_av,sc_bki_n\n";
    const file = evt.target.files[0];
    let reader = new FileReader();
    // Closure to capture the file information.
    let rows = 0;
    reader.onload = (e => {
      new CSV(e.target.result, { header: true, cast: ['String', 'Number', 'String', 'String', 'String', 'String'] }).forEach(object => {//{ cast: ['String', 'Number', 'Number', 'Boolean'] }
        const std1_data = decodeSTD1(object.packet1);
        const std2_data = decodeSTD2(object.packet2);
        const std3_data = decodeSTD3(object.packet3);
        for(let key in std1_data){
          stddata_csv_contents += std1_data[key] + ",";
        }
        for(let key in std2_data){
          stddata_csv_contents += std2_data[key] + ",";
        }
        for(let key in std3_data){
          stddata_csv_contents += std3_data[key] + ",";
        }
        stddata_csv_contents += "\n";
      });
    });
    reader.readAsBinaryString(file);
}

const handleSTDDataDownload = () => {
  const blob = new Blob([ stddata_csv_contents ], { "type" : "text/plain" });
  document.getElementById("downloadstddatacsv").href = window.URL.createObjectURL(blob);
}
