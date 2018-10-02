# NFC-Electron Reader

Uses Electron-Webpack, Electron Builder, Babel 7 and Vue, internally powered by nfc-pcsc


## Build Process

- To build:

```
npm run build

or

yarn build
```

- Note: Currently, it does not clean previous builds before building. Most of the time it would be fine, but if it does not build, remove all files and folders inside `dist/` and `build/` folders. DO NOT REMOVE `build/icons/` folder.

### Special Note
- This reader programs rely on node native module, specifically `node-pcsclite`. This means it need to be recompiled in target operating system before it can run. See [node-pcsclite](https://github.com/pokusew/node-pcsclite) for more info.

#### For Windows
- In Windows: `node-gyp` and `windows-build-tools` are required. 
  - See [node-gyp](https://github.com/nodejs/node-gyp) for more details
- Build Steps: 
  - In an ELEVATED PowerShell, run:

```
npm install -g node-gyp windows-build-tools
```

  - After install, **reboot** (required)
  - Change directory and run:

```
npm install
npm run rebuild

or 

yarn
yarn rebuild
```

## Author's Notes
- Processes
  - Main Process: Controls communication with NFC Device.
  - Renderer Process: User Interface

- Communication between Main and Renderer process: Via Electron IPC. Read/Write/Write-Readonly permissions as well as messages are set through ipc messages
  - Read [ipcRenderer](https://electronjs.org/docs/api/ipc-renderer) and [ipcMain](https://electronjs.org/docs/api/ipc-main) for more details
  
- There are 3 pages in the application, read, write, and bulk-write. Some of the features are shared between them (i.e. Start write and make read-only, etc.), so I put them into different Mixins in `src/mixins` folder. 
  - Mixins literally added functions or variables to the components, so it might be surprising to see methods called within functions but no declaration anywhere. Check the specific mixins for function declarations. 
  - See [Mixins](https://vuejs.org/v2/guide/mixins.html) for more details
  
  
- Vue, vue-property-decorator, and vue-class-component
  - This application uses Vue 2, so for any documentations, see [Vue 2 Guide](https://vuejs.org/v2/guide/)
  - [vue-class-component](https://github.com/vuejs/vue-class-component) is an official extension of VueJS, allowing users to write components in JS class (instead of conventional objects). This allows better organization of code. However, `vue-class-component` uses Decorators (Stage 2 Proposals) and Class field declarations (Stage 3 proposals). Since they are not standard features of ECMAScript, they might be phased out in the future (although there are significant supports for them). However, they will not be a big problem since Babel will translate all these proposals to standard Javascripts.
  - [vue-property-decorator](https://github.com/kaorun343/vue-property-decorator) extends on the idea of `vue-class-component`, providing JS decorators for other frequently used Vue options (Props, Watch, etc.). However, it's not an official VueJS extension, so if there is any problems with the decorators, remove the decorators and add them into @Component decorator outlined in the `vue-class-component` documentation, otherwise convert the class back to standard Vue 2 objects.

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
## Known Issues

### Babel Plugins

Due to how `electron-webpack` creates `babel-loader` for `webpack`, some plugins cannot be configured if installed as devDependencies.

If you wishes to configure these Babel plugins, install plugins as dependencies. This might increases output size.
