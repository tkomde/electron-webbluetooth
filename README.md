# electron-WebBluetooth

WebBluetooth integration sample with electron. Supports select multiple device candidates to connect.

## Prerequisites

- electron(>=3 will work)
- bootstrap(included)

### How it works

1. In renderer, scan() to get device list.
1. The devices list is notified periodically via IPC in main.
1. If you find the deviceId you want to connect, select and notify to main.
1. Connection callback called once in main, and delete deviceId.
1. (Experimental) Automatically connect former device when disconnected.

### Restrictions to implement WebBluetooth in electron

- If event.preventDefault is not called, first available device will be selected.
- Callback should be called with deviceId to be selected, passing empty string to callback will **cancel** the request.
- Calling requestDevice twice causes automatically cancel the former one.
- **Calling requestDevice automatically is not allowed** as same as normal webbluetooth.

## Link

[Electron Documentation - webContents](https://electronjs.org/docs/api/web-contents#event-select-bluetooth-device)

## License

MIT
