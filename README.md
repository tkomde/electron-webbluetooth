# electron-WebBluetooth

WebBluetooth integration sample with electron. 
Supports selecting multiple device, and reconnection.

## Prerequisites

- electron(>=3 will work)
- bootstrap(included)

### How it works

1. In renderer, scan() to get device list.
1. The devices list is notified periodically via IPC to main process.
  1. If you find the deviceId you want to connect, select and notify to main.
1. Connection callback called only once in main.
1. When disconnected, automatically reconnect former connected device.

### Restrictions to implement WebBluetooth in electron

- If event.preventDefault is not called, first available device will be selected.
- Callback should be called with deviceId to be selected, passing empty string to callback will **cancel** the request.
- Calling requestDevice twice causes automatically cancel the former one.
- **Calling requestDevice automatically is not allowed** as same as normal webbluetooth.

## Link

[Electron Documentation - webContents](https://electronjs.org/docs/api/web-contents#event-select-bluetooth-device)
[Web Bluetooth / Automatic Reconnect Sample](https://googlechrome.github.io/samples/web-bluetooth/automatic-reconnect.html)

## License

MIT
