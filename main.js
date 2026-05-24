const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const screen = electron.screen;
const ipcMain = electron.ipcMain;
const path = require('path');
const fs = require('fs');

let settingsPath;
let win;
let tray;
let settingsWin = null;
let settings;

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) {}
  return {
    active: true,
    duration: 8,
    position: { x: null, y: null },
    size: 'medium',
    volume: 100
  };
}

function saveSettings() {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  } catch (e) {
    console.error('Erreur sauvegarde settings:', e);
  }
}

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
  win.setAlwaysOnTop(true, 'pop-up-menu');
  win.setVisibleOnAllWorkspaces(true);
}

function openSettingsWindow() {
  if (settingsWin) {
    settingsWin.focus();
    return;
  }

  settingsWin = new BrowserWindow({
    width: 340,
    height: 520,
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

  settingsWin.webContents.on('did-finish-load', () => {
    settingsWin.webContents.send('load-settings', settings);
  });
}

function sendSettings() {
  win.webContents.send('update-settings', settings);
}

function saveAndSend() {
  saveSettings();
  sendSettings();
  updateTrayMenu();
}

ipcMain.on('save-settings', (event, newSettings) => {
  settings = { ...settings, ...newSettings };
  saveAndSend();
});

function createEasterEgg() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;

  const egg = new BrowserWindow({
    width: 100,
    height: 100,
    transparent: true,
    frame: false,
    skipTaskbar: true,
    focusable: false,
    alwaysOnTop: true,
    x: 0,
    y: 0,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  egg.loadFile('easter.html');
  egg.setIgnoreMouseEvents(true);

  let x = 0;
  let y = 0;
  let dx = 25;
  let dy = 20;
  let steps = 0;
  const maxSteps = 60;

  const interval = setInterval(() => {
    x += dx;
    y += dy;

    if (x <= 0 || x >= width - 100) dx = -dx;
    if (y <= 0 || y >= height - 100) dy = -dy;

    if (Math.random() < 0.2) dx = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
    if (Math.random() < 0.2) dy = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);

    egg.setPosition(Math.round(x), Math.round(y));
    steps++;

    if (steps >= maxSteps) {
      clearInterval(interval);
      egg.close();
    }
  }, 16);
}

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
          saveAndSend();
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
          { label: '3 secondes',  type: 'radio', checked: settings.duration === 3,  click: () => { settings.duration = 3;  saveAndSend(); } },
          { label: '5 secondes',  type: 'radio', checked: settings.duration === 5,  click: () => { settings.duration = 5;  saveAndSend(); } },
          { label: '8 secondes',  type: 'radio', checked: settings.duration === 8,  click: () => { settings.duration = 8;  saveAndSend(); } },
          { label: '15 secondes', type: 'radio', checked: settings.duration === 15, click: () => { settings.duration = 15; saveAndSend(); } },
          { label: '30 secondes', type: 'radio', checked: settings.duration === 30, click: () => { settings.duration = 30; saveAndSend(); } },
        ]
      },
      {
        label: 'Taille',
        submenu: [
          { label: 'Petit',  type: 'radio', checked: settings.size === 'small',    click: () => { settings.size = 'small';    saveAndSend(); } },
          { label: 'Moyen',  type: 'radio', checked: settings.size === 'medium',   click: () => { settings.size = 'medium';   saveAndSend(); } },
          { label: 'Grand',  type: 'radio', checked: settings.size === 'large',    click: () => { settings.size = 'large';    saveAndSend(); } },
          { label: 'Enorme', type: 'radio', checked: settings.size === 'enormous', click: () => { settings.size = 'enormous'; saveAndSend(); } },
        ]
      },
      {
        label: 'Volume',
        submenu: [
          { label: '0% (muet)', type: 'radio', checked: settings.volume === 0,   click: () => { settings.volume = 0;   saveAndSend(); } },
          { label: '25%',       type: 'radio', checked: settings.volume === 25,  click: () => { settings.volume = 25;  saveAndSend(); } },
          { label: '50%',       type: 'radio', checked: settings.volume === 50,  click: () => { settings.volume = 50;  saveAndSend(); } },
          { label: '75%',       type: 'radio', checked: settings.volume === 75,  click: () => { settings.volume = 75;  saveAndSend(); } },
          { label: '100%',      type: 'radio', checked: settings.volume === 100, click: () => { settings.volume = 100; saveAndSend(); } },
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
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  settings = loadSettings();

  createOverlay();
  createTray();
  createEasterEgg();

  win.webContents.on('did-finish-load', () => {
    sendSettings();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});