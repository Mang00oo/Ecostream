const { app, BrowserWindow, ipcMain, TouchBar, nativeImage } = require('electron/main')

const { TouchBarLabel, TouchBarButton, TouchBarSpacer, TouchBarSlider } = TouchBar

const cp = require('child_process')
const os = require('os')

const path = require('path')

let mainWindow;

let isPlaying = false;

app.setAppUserModelId("com.mang0o.Ecostream");
if (require('electron-squirrel-startup')) app.quit();

const play = new TouchBarButton({
  label: 'Play',
  click: () => {
      mainWindow.webContents.send('from-main', 'toggle-playback');
  }
});

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    title: "Ecostream",
    frame: false,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 25 },
    titleBarOverlay: true,
    
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Link your preload script
    }
  })
  ipcMain.on('to-main', (event, data) => {
    if (data.func === 'getDeviceName') {
      const deviceName = getComputerName();
      mainWindow.webContents.send('from-main', {deviceName: deviceName});
    }
    if (data.func === 'updatePlayback') {
      isPlaying = data.isPlaying;
      play.label = isPlaying? 'Pause' : 'Play'
    }
  });

  const isDev = !app.isPackaged; 

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000'); 
  } else {
    mainWindow.loadFile(path.join(process.resourcesPath, 'build', 'index.html'));
  }
  mainWindow.setTouchBar(touchBar);

  mainWindow.on('close', function (event) {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function getComputerName() {
  switch (process.platform) {
    case "win32":
      return process.env.COMPUTERNAME;
    case "darwin":
      return cp.execSync("scutil --get ComputerName").toString().trim();
    case "linux":
      const prettyname = cp.execSync("hostnamectl --pretty").toString().trim();
      return prettyname === "" ? os.hostname() : prettyname;
    default:
      return os.hostname();
  }
}
/* 

new TouchBarSlider({
  label: 'Seek',
  minValue: 0,
  maxValue: 100,
  value: 0,
  change: (newValue) => {
    
  }
}),

*/

const touchBar = new TouchBar({
  items: [
    new TouchBarSpacer({
      size:'flexible'
    }),
    play,
    new TouchBarSpacer({
      size:'flexible'
    }),
  ]
})

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  });
  const iconPath = path.join(__dirname, '..', '..', 'assets/icon.png'); 
  const image = nativeImage.createFromPath(iconPath);
  
  if (process.platform === 'darwin') {
    app.dock.setIcon(image); // Forces macOS to update bundle representation
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    } else {
        mainWindow.show();
    }
})
app.on('before-quit', () => {
    app.quit();
})