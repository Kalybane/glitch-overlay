const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const screen = electron.screen;
const ipcMain = electron.ipcMain;
const path = require('path');

let win;
let tray;
let settingsWin = null;
let settings = {
  active: true,
  duration: 8,
  position: { x: null, y: null },
  size: 'medium',
  volume: 100
};

function createOverlay() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x, y, width, height } = primaryDisplay.bounds;

  win = new BrowserWindow({
    width: width,
    height: height,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    x: x,
    y: y,
  });

  win.loadFile('index.html');
  win.setIgnoreMouseEvents(true);
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
}

function openSettingsWindow() {
  if (settingsWin) {
    settingsWin.focus();
    return;
  }

  settingsWin = new BrowserWindow({
    width: 340,
    height: 480,
    resizable: false,
    alwaysOnTop: true,
    title: 'Glitch Overlay - Reglages',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  settingsWin.loadFile('settings.html');
  settingsWin.setMenuBarVisibility(false);

  settingsWin.on('closed', () => {
    settingsWin = null;
  });

  // Envoie les settings actuels à la fenêtre
  settingsWin.webContents.on('did-finish-load', () => {
    settingsWin.webContents.send('load-settings', settings);
  });
}

function sendSettings() {
  win.webContents.send('update-settings', settings);
}

// Reçoit les settings depuis settings.html
ipcMain.on('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  sendSettings();
  updateTrayMenu();
});

let updateTrayMenu;

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  updateTrayMenu = function() {
    const menu = Menu.buildFromTemplate([
      {
        label: settings.active ? 'Overlay actif' : 'Overlay desactive',
        enabled: false,
      },
      { type: 'separator' },
      {
        label: settings.active ? 'Desactiver' : 'Activer',
        click: () => {
          settings.active = !settings.active;
          sendSettings();
          updateTrayMenu();
        }
      },
      { type: 'separator' },
      {
        label: 'Reglages position',
        click: () => openSettingsWindow()
      },
      { type: 'separator' },
      {
        label: 'Duree affichage',
        submenu: [
          { label: '3 secondes',  type: 'radio', checked: settings.duration === 3,  click: () => { settings.duration = 3;  sendSettings(); updateTrayMenu(); } },
          { label: '5 secondes',  type: 'radio', checked: settings.duration === 5,  click: () => { settings.duration = 5;  sendSettings(); updateTrayMenu(); } },
          { label: '8 secondes',  type: 'radio', checked: settings.duration === 8,  click: () => { settings.duration = 8;  sendSettings(); updateTrayMenu(); } },
          { label: '15 secondes', type: 'radio', checked: settings.duration === 15, click: () => { settings.duration = 15; sendSettings(); updateTrayMenu(); } },
          { label: '30 secondes', type: 'radio', checked: settings.duration === 30, click: () => { settings.duration = 30; sendSettings(); updateTrayMenu(); } },
        ]
      },
      {
        label: 'Taille',
        submenu: [
          { label: 'Petit',  type: 'radio', checked: settings.size === 'small',  click: () => { settings.size = 'small';  sendSettings(); updateTrayMenu(); } },
          { label: 'Moyen',  type: 'radio', checked: settings.size === 'medium', click: () => { settings.size = 'medium'; sendSettings(); updateTrayMenu(); } },
          { label: 'Grand',  type: 'radio', checked: settings.size === 'large',  click: () => { settings.size = 'large';  sendSettings(); updateTrayMenu(); } },
        ]
      },
      {
        label: 'Volume',
        submenu: [
          { label: '0% (muet)', type: 'radio', checked: settings.volume === 0,   click: () => { settings.volume = 0;   sendSettings(); updateTrayMenu(); } },
          { label: '25%',       type: 'radio', checked: settings.volume === 25,  click: () => { settings.volume = 25;  sendSettings(); updateTrayMenu(); } },
          { label: '50%',       type: 'radio', checked: settings.volume === 50,  click: () => { settings.volume = 50;  sendSettings(); updateTrayMenu(); } },
          { label: '75%',       type: 'radio', checked: settings.volume === 75,  click: () => { settings.volume = 75;  sendSettings(); updateTrayMenu(); } },
          { label: '100%',      type: 'radio', checked: settings.volume === 100, click: () => { settings.volume = 100; sendSettings(); updateTrayMenu(); } },
        ]
      },
      { type: 'separator' },
      {
        label: 'Quitter',
        click: () => app.quit()
      }
    ]);

    tray.setContextMenu(menu);
    tray.setToolTip(settings.active ? 'Glitch Overlay - Actif' : 'Glitch Overlay - Desactive');
  };

  updateTrayMenu();
}

app.whenReady().then(() => {
  createOverlay();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});