/* eslint-disable no-param-reassign */
/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as zmq from 'zeromq';
import { VM } from 'vm2';
import MenuBuilder from './menu';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    // HACK: We need to enable nodeIntegration due to an apparent problem/bug
    // with Material UI
    // https://github.com/electron-react-boilerplate/electron-react-boilerplate/issues/2395
    webPreferences: {
      nodeIntegration: true
    }
    // webPreferences:
    //   process.env.NODE_ENV === 'development' || process.env.E2E_BUILD === 'true'
    //     ? {
    //         nodeIntegration: true
    //       }
    //     : {
    //         preload: path.join(__dirname, 'dist/renderer.prod.js')
    //       }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

ipcMain.on('zmq-request', async (event, arg) => {
  const sock = new zmq.Request({
    connectTimeout: 5000,
    sendTimeout: 10000,
    receiveTimeout: 10000
  });

  try {
    sock.connect(arg.url);

    console.log('Main process sending message', arg.message);

    let result;

    try {
      await sock.send(arg.message);
      [result] = await sock.receive();
    } catch (e) {
      console.error('Send/receive error', e);
    }

    console.log('Main process received message', result);

    // If request was encoded, send response back encoded
    if (arg.encoding === 'base64') {
      event.returnValue = result?.toString('base64');
    } else {
      event.returnValue = result;
    }
  } catch (e) {
    console.error(e);
  }
});

// Execute js using vm2, a secure sandbox
ipcMain.on('execute-js', async (event, arg) => {
  console.log('Main process received execute js request');

  // Create a sandboxed environment passing in the response so that the user
  // can run tests against it
  const vm = new VM({
    timeout: 10000,
    sandbox: {
      response: arg.response
    }
  });
  let message;
  let data;

  try {
    data = vm.run(arg.code);

    // Success if value returned is truthy
    message = {
      isSuccess: !!data,
      result: data
    };
  } catch (e) {
    message = {
      isSuccess: false,
      result: data,
      reason: e.message
    };
    console.error(e);
  }

  console.log('Main process sending result');
  event.returnValue = message;
});
