# electron-WebBluetooth

WebBluetooth integration sample with electron. 
Supports selecting multiple device, and reconnection.

## Prerequisites

- electron(>=3 will work)
- bootstrap(included)

## Run

- npm i
- npx electron .

## How it works

1. In renderer, scan() to get device list.
1. The devices list is notified periodically via IPC to main process.
  1. If you find the deviceId you want to connect, select and notify to main.
1. Connection callback called only once in main.
1. When disconnected, automatically reconnect former connected device.

## Restrictions to implement WebBluetooth in electron

- If event.preventDefault is not called, first available device will be selected.
- Callback should be called with deviceId to be selected, passing empty string to callback will **cancel** the request.
- Calling requestDevice twice causes automatically cancel the former one.
- By default, requestDevice cannot be called automatically. You can execute it via executeJavaScript() from main script(comment out L60 in main.js).

## Link

[Electron Documentation - webContents - select-bluetooth-device](https://electronjs.org/docs/api/web-contents#event-select-bluetooth-device)
[Electron Documentation - webContents - executejavascriptcode-usergesture](https://electronjs.org/docs/api/web-contents#contentsexecutejavascriptcode-usergesture)
[Web Bluetooth / Automatic Reconnect Sample](https://googlechrome.github.io/samples/web-bluetooth/automatic-reconnect.html)

## License

MIT
