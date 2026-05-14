const { app, BrowserWindow, ipcMain, TouchBar } = require('electron/main')

const { TouchBarLabel, TouchBarButton, TouchBarSpacer } = TouchBar

const path = require('path')

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
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
    console.log('Received in Main:', data);
    // Send a response back to React
    mainWindow.webContents.send('from-main', 'Message received by Main Process!');
  });

  mainWindow.loadURL('http://100.90.153.39:3000')
  mainWindow.setTouchBar(touchBar)

  mainWindow.on('close', function (event) {
  if (!app.isQuitting) {
    event.preventDefault();
    mainWindow.hide();
  }
});

}

let isPlaying = false;
const play = new TouchBarButton({
  label: 'Play',
  click: () => {
    if (isPlaying) {
      mainWindow.webContents.send('from-main', 'pause-event');
      play.label = 'Play';
    } else {
        mainWindow.webContents.send('from-main', 'play-event');
        play.label = 'Pause';
    }
    isPlaying = !isPlaying;
  }
})

const touchBar = new TouchBar({
  items: [
    play,
  ]
})

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
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