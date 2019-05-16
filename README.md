# electron-webbt

Chromium Webbluetooth integration sample with electron.

## Prerequisites

- electron(Maybe >=3 will work)
- bootstrap(included)

## Implementation

I don't have a confidence that this method is proper or not. But it works ;).

### How it works

1. Scan(requestDevice in renderer, and no callback in main) to get device list.
1. If device you want to connect is found, rerun scan (with callback in main).

### Restrictions to implement WebBluetooth in electron

- If event.preventDefault is not called, first available device will be selected.
- callback should be called with deviceId to be selected, passing empty string to callback will **cancel** the request.
- callback should be called asap(so it needs scan twice).
- Calling requestDevice twice causes automatically cancel the former one.

## Link

[Electron Documentation - webContents](https://electronjs.org/docs/api/web-contents#event-select-bluetooth-device)

## License

MIT
