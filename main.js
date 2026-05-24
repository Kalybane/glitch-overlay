const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;
const Menu = electron.Menu;
const path = require('path');

let win;
let tray;
let settings = {
  active: true,
  duration: 8,
  position: 'bottom-right',
  size: 'medium'
};

function createOverlay() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    x: 0,
    y: 0,
  });

  win.loadFile('index.html');
  win.setIgnoreMouseEvents(true);
}

function sendSettings() {
  win.webContents.send('update-settings', settings);
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));

  function updateMenu() {
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
          updateMenu();
        }
      },
      { type: 'separator' },
      {
        label: 'Duree affichage',
        submenu: [
          { label: '3 secondes',  type: 'radio', checked: settings.duration === 3,  click: () => { settings.duration = 3;  sendSettings(); updateMenu(); } },
          { label: '5 secondes',  type: 'radio', checked: settings.duration === 5,  click: () => { settings.duration = 5;  sendSettings(); updateMenu(); } },
          { label: '8 secondes',  type: 'radio', checked: settings.duration === 8,  click: () => { settings.duration = 8;  sendSettings(); updateMenu(); } },
          { label: '15 secondes', type: 'radio', checked: settings.duration === 15, click: () => { settings.duration = 15; sendSettings(); updateMenu(); } },
          { label: '30 secondes', type: 'radio', checked: settings.duration === 30, click: () => { settings.duration = 30; sendSettings(); updateMenu(); } },
        ]
      },
      {
        label: 'Position',
        submenu: [
          { label: 'Haut gauche',  type: 'radio', checked: settings.position === 'top-left',     click: () => { settings.position = 'top-left';     sendSettings(); updateMenu(); } },
          { label: 'Haut droit',   type: 'radio', checked: settings.position === 'top-right',    click: () => { settings.position = 'top-right';    sendSettings(); updateMenu(); } },
          { label: 'Bas gauche',   type: 'radio', checked: settings.position === 'bottom-left',  click: () => { settings.position = 'bottom-left';  sendSettings(); updateMenu(); } },
          { label: 'Bas droit',    type: 'radio', checked: settings.position === 'bottom-right', click: () => { settings.position = 'bottom-right'; sendSettings(); updateMenu(); } },
          { label: 'Centre',       type: 'radio', checked: settings.position === 'center',       click: () => { settings.position = 'center';       sendSettings(); updateMenu(); } },
        ]
      },
      {
        label: 'Taille',
        submenu: [
          { label: 'Petit',  type: 'radio', checked: settings.size === 'small',  click: () => { settings.size = 'small';  sendSettings(); updateMenu(); } },
          { label: 'Moyen',  type: 'radio', checked: settings.size === 'medium', click: () => { settings.size = 'medium'; sendSettings(); updateMenu(); } },
          { label: 'Grand',  type: 'radio', checked: settings.size === 'large',  click: () => { settings.size = 'large';  sendSettings(); updateMenu(); } },
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
  }

  updateMenu();
}

app.whenReady().then(() => {
  createOverlay();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});