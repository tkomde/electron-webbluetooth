# electron-WebBluetooth

WebBluetooth integration sample with electron. Supports select multiple device candidates to connect.

## Prerequisites

- electron(>=3 will work)
- bootstrap(included)

### How it works

1. Scan(requestDevice in renderer, and no callback in main) to get device list.
1. The device list is called periodically.
1. If you find the deviceId you want to connect, select and notify to main.
1. Connection callback called once, and delete deviceId.

### Restrictions to implement WebBluetooth in electron

- If event.preventDefault is not called, first available device will be selected.
- Callback should be called with deviceId to be selected, passing empty string to callback will **cancel** the request.
- Callback should be called asap.
- Calling requestDevice twice causes automatically cancel the former one.

## Link

[Electron Documentation - webContents](https://electronjs.org/docs/api/web-contents#event-select-bluetooth-device)

## License

MIT
