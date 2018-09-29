'use strict';

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import NFCWrapper from 'common/NFCWrapper';

const isDevelopment = process.env.NODE_ENV !== 'production';

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow;
let nfc;

function createMainWindow() {
  const window = new BrowserWindow({
    height: 800,
    width: 800,
  });

  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`);
  } else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true,
    }));
  }

  window.on('closed', () => {
    mainWindow = null;
    nfc = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

function nfcHandler() {
  const nfcWrapper = new NFCWrapper();
  nfcWrapper.startDefault();

  // Relay information to renderer
  nfcWrapper.on('operation-complete', (payload) => {
    console.log(payload);
    mainWindow.webContents.send('operation-complete', payload);
  });

  // nfcWrapper.on('readerend', () => {
  //   mainWindow.webContents.send('reader-status', 'Reader Disconnected');
  // });

  // nfcWrapper.on('readerconn', () => {
  //   mainWindow.webContents.send('reader-status', 'Reader Connected');
  // });

  // nfcWrapper.on('nfc-error', (payload) => {
  //   mainWindow.webContents.send('nfc-status', payload);
  // });

  ipcMain.on('set-read', (event, args) => {
    console.log('read', args);
    nfcWrapper.setAllowRead(args);
  });

  ipcMain.on('set-write', (event, args) => {
    console.log('write', args);
    nfcWrapper.setAllowWrite(args);
  });

  ipcMain.on('set-write-readonly', (event, args) => {
    console.log('readonly', args);
    nfcWrapper.setAllowWriteReadonly(args);
  });

  ipcMain.on('set-permission', (event, args) => {
    console.log('perm', args);
    nfcWrapper.setAllowRead(args[0]);
    nfcWrapper.setAllowWrite(args[1]);
    nfcWrapper.setAllowWriteReadonly(args[2]);
  });

  ipcMain.on('set-message', (event, args) => {
    console.log('msg', args);
    nfcWrapper.setMessage(args);
  });
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow();
  }
  if (nfc === null) {
    nfc = nfcHandler();
  }
});

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  nfc = nfcHandler();
});
