const path = require('node:path');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { QuitMapDatabase } = require('./database.cjs');

let mainWindow;
let database;

function logDevelopment(message) {
  if (!app.isPackaged) console.log(`[QuitMap] ${message}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: '#f6f8f5',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

function registerIpc() {
  ipcMain.handle('data:dashboard', () => database.getDashboard());
  ipcMain.handle('data:focus-map', () => database.getFocusMap());
  ipcMain.handle('data:timeline', (_event, range) => database.getTimeline(range));
  ipcMain.handle('data:insights', () => database.getInsights());
  ipcMain.handle('data:weekly', () => database.getWeekly());
  ipcMain.handle('data:diagnostics', () => {
    if (app.isPackaged) throw new Error('Diagnostics are available only in development builds.');
    return database.getDiagnostics();
  });
  ipcMain.handle('data:locations', () => database.getLocations());
  ipcMain.handle('locations:create', (_event, name) => database.createLocation(name));
  ipcMain.handle('focus:start', (_event, payload) => database.startFocusSession(payload || {}));
  ipcMain.handle('focus:end', (_event, id) => database.endFocusSession(id));
  ipcMain.handle('monitor:sample', (_event, payload) => database.recordNoise(payload || {}));
  ipcMain.handle('settings:get', () => database.getSettings());
  ipcMain.handle('settings:update', (_event, patch) => database.updateSettings(patch || {}));
  ipcMain.handle('data:delete-all', async () => {
    const choice = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Cancel', 'Delete all data'],
      defaultId: 0,
      cancelId: 0,
      title: 'Delete all QuitMap data?',
      message: 'This permanently removes your environment history and focus statistics from this device.',
      detail: 'QuitMap keeps this data only in its local SQLite database.',
    });
    if (choice.response === 1) {
      database.clearData();
      return { deleted: true };
    }
    return { deleted: false };
  });
  ipcMain.handle('data:seed-demo', (_event, days) => {
    if (app.isPackaged) throw new Error('Demo data is available only in development builds.');
    return database.seedDemoData(days);
  });
  ipcMain.on('monitor:level', (_event, level) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('monitor:level', level);
  });
}

app.whenReady().then(async () => {
  const databasePath = path.join(app.getPath('userData'), 'quitmap.sqlite');
  database = new QuitMapDatabase(databasePath, { debug: !app.isPackaged });
  await database.initialize();
  logDevelopment(`Database: ${databasePath}`);
  registerIpc();
  createWindow();
  mainWindow.webContents.session.setPermissionRequestHandler((_contents, permission, callback) => {
    if (permission !== 'media') return callback(false);
    dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['Not now', 'Allow microphone'],
      defaultId: 0,
      cancelId: 0,
      title: 'Allow QuitMap to measure ambient sound?',
      message: 'QuitMap will measure a momentary sound level locally.',
      detail: 'No audio is recorded, stored, analyzed, or uploaded.',
    }).then((result) => callback(result.response === 1));
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
