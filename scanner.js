'use strict'

const {ipcRenderer} = require('electron')
const notifier = require('node-notifier')
const pogobuf = require('pogobuf')
const POGOProtos = require('node-pogo-protos')
const bluebird = require('bluebird')
// const Long = require('long')
const path = require('path')

var google = new pogobuf.GoogleLogin()
var client = new pogobuf.Client()

var nearbyList = []

var scan = function(self, callback) {
  google.login(self.username, self.password).then(token => {
    client.setAuthInfo('google', token)
    client.setPosition(self.lat, self.lng)
    return client.init()
  }).then(() => {
    var cellIDs = pogobuf.Utils.getCellIDs(self.lat, self.lng)
    return bluebird.resolve(client.getMapObjects(cellIDs, Array(cellIDs.length).fill(0))).then(mapObjects => {
      return mapObjects.map_cells
    }).each(cell => {
      return bluebird.resolve(cell.catchable_pokemons).each(catchablePokemon => {
        if (nearbyList.indexOf(catchablePokemon.pokemon_id) == -1) {
          console.log('main.js - There is a ' + pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, catchablePokemon.pokemon_id) + ' near.')
          var icon =  '' + catchablePokemon.pokemon_id
          var pad = '000'

          notifier.notify({
            icon: path.join(__dirname, 'icons', pad.substring(0, pad.length - icon.length) + icon + ".png"),
            title: 'Nearby pokemon',
            message: 'There is a ' + pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, catchablePokemon.pokemon_id) + ' near.',
            urgency: 'critical'
          })

          nearbyList.push(catchablePokemon.pokemon_id)

          callback(nearbyList)
          setTimeout(function () {
            nearbyList.splice(nearbyList.indexOf(catchablePokemon.pokemon_id), 1)
            callback(nearbyList)
          }, 20 * 60000)
        }
      })
    })
  }).catch(function(err) {
    console.error(err)
    notifier.notify({
      icon: path.join(__dirname, 'icons/app.png'),
      title: 'Error',
      message: err,
      urgency: 'critical'
    })
  })
}

var start_scanning = function(callback) {
  console.log(this.username)
  let self = this
  scan(self, callback)
  setInterval(() => {
    scan(self, callback)
  }, 10 * 60000)// scan every 10min
}

module.exports = {
  'username': '',
  'password': '',
  'lat': 0.0,
  'lng': 0.0,
  'start_scanning': start_scanning
}
