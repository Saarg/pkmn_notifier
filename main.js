'use strict'

const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const ipcMain = electron.ipcMain
const BrowserWindow = electron.BrowserWindow

let mainWindow = null
let tray = null

let spawnList = [{label: 'Pkmn list empty'}]

function createWindow () {
  tray = new Tray(__dirname+'/icons/app.png')
  const contextMenu = Menu.buildFromTemplate(spawnList)
  tray.setToolTip('pkmn_notifier')
  tray.setContextMenu(contextMenu)

  mainWindow = new BrowserWindow({icon:'icons/app.png', width: 300, height: 210})

  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('UpdateList', (event, nearbyList) => {
  if(nearbyList.length > 0) {
    spawnList = []
    for (var pkmn_name of nearbyList) {
      spawnList.push({label: pkmn_name})
    }
  } else {
    spawnList = [{label: 'Pkmn list empty'}]
  }

  const contextMenu = Menu.buildFromTemplate(spawnList)
  tray.setContextMenu(contextMenu)
})
