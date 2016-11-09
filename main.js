'use strict'

const electron = require('electron')
const path = require('path')
const pogobuf = require('pogobuf')
const POGOProtos = require('node-pogo-protos')
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const ipcMain = electron.ipcMain
const BrowserWindow = electron.BrowserWindow

let scanner = require('./scanner')

let mainWindow = null
let tray = null

let spawnList = [{label: 'Pkmn list empty'}]
let bottomTray = [
  {type: 'separator'},
  {
    label: 'Open window',
    click (item, focusedWindow) {
      if (mainWindow) mainWindow.show()
    }
  },
  {
    label: 'Start scanning',
    click (item, focusedWindow) {
      if(scanner.username != '' && scanner.password != '' &&
        scanner.lat != 0.0 && scanner.lng != 0.0) {
        scanner.start_scanning(UpdateList)

        bottomTray.pop()
        const contextMenu = Menu.buildFromTemplate(spawnList.concat(bottomTray))
        tray.setContextMenu(contextMenu)
      } else if (mainWindow)
        mainWindow.show()
    }
  }
]

function createWindow () {
  tray = new Tray(__dirname+'/icons/app.png')
  const contextMenu = Menu.buildFromTemplate(spawnList.concat(bottomTray))
  tray.setToolTip('pkmn_notifier')
  tray.setContextMenu(contextMenu)

  mainWindow = new BrowserWindow({icon: path.join(__dirname, 'icons/app.png'), width: 300, height: 210})

  mainWindow.loadURL(`file://${__dirname}/index.html`)

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.hide()
}

app.on('ready', createWindow)

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})

function UpdateList (nearbyList) {
  if(nearbyList.length > 0) {
    spawnList = []
    for (var pkmn_id of nearbyList) {
      var icon =  '' + pkmn_id
      var pad = '000'

      spawnList.push({
        icon: path.join(__dirname, 'icons', pad.substring(0, pad.length - icon.length) + icon + '.png'),
        label: pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, pkmn_id)
      })
    }
  } else {
    spawnList = [{label: 'Pkmn list empty'}]
  }

  const contextMenu = Menu.buildFromTemplate(spawnList.concat(bottomTray))
  tray.setContextMenu(contextMenu)
}

ipcMain.on('ScannerReady', (event, s) => {
  scanner.username = s.username
  scanner.password = s.password
  scanner.lat = parseFloat(s.lat)
  scanner.lng = parseFloat(s.lng)

  if(scanner.username != '' && scanner.password != '' &&
    scanner.lat != 0.0 && scanner.lng != 0.0) {
    scanner.start_scanning(UpdateList)

    bottomTray.pop()
    const contextMenu = Menu.buildFromTemplate(spawnList.concat(bottomTray))
    tray.setContextMenu(contextMenu)
  }
})
