# NFC-Electron Reader

Uses Electron-Webpack, Electron Builder, Babel 7 and Vue, internally powered by nfc-pcsc

# Yarn

- Electron Builder recommends using `Yarn` to build. When using Yarn, the lock file is used and guaranteed to download the correct version for the working build. There is no such guarantee for `npm`

- To install `yarn`: 

```
npm install -g yarn
```

- Switching to `yarn`: Remove `node_modules/` folder and then run 

```
yarn
```

- To build with `yarn`, run:

```
yarn build
```

## Build Process

- To build:

```
npm run build

or

yarn build
```

- Note: Currently, it does not clean previous builds before building. Most of the time it would be fine, but if it does not build, remove all files and folders inside `dist/` and `build/` folders. DO NOT REMOVE `build/icons/` folder.

### Special Note for Windows
- This reader programs rely on node native module, which means it need to be recompiled before it can run. In windows, it can be difficult to set up environment
  - See [node-gyp](https://github.com/nodejs/node-gyp) for more details

- In Windows: `node-gyp` and `windows-build-tools` are required. In an ELEVATED PowerShell, run:

```
npm install -g node-gyp windows-build-tools
```

- After install, reboot
- Change directory and run:

```
npm install
npm run rebuild
```

or 

```
yarn
yarn build
```

## Brief Explanation
- Main Process: Controls communication with NFC Device.
- Renderer Process: Reader/Writer Interface

- Communication between Main and Renderer process: Via Electron IPC. Read/Write/Write-Readonly permissions as well as messages are set through ipc messages
  - Read [ipcRenderer](https://electronjs.org/docs/api/ipc-renderer) and [ipcMain](https://electronjs.org/docs/api/ipc-main)

## Known Issues

### Babel Plugins

Due to how `electron-webpack` creates `babel-loader` for `webpack`, some plugins cannot be configured if installed as devDependencies.

If you wishes to configure these Babel plugins, install plugins as dependencies.