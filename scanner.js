'use strict'

const notifier = require('node-notifier')
const pogobuf = require('pogobuf')
const POGOProtos = require('node-pogo-protos')
const bluebird = require('bluebird')
// const Long = require('long')
const path = require('path')

var google = new pogobuf.GoogleLogin()
var client = new pogobuf.Client()

var nearbyList = []

var start_scanning = function() {
  console.log(this.username)
  let self = this
  // Login ===================================================================
  google.login(self.username, self.password).then(token => {
    client.setAuthInfo('google', token)
    client.setPosition(self.lat, self.lng)
    return client.init()
  }).then(() => {
    console.log('Bad first HOTFIX')
  })

  // FIXME BAD BAD HOTFIX
  google.login(self.username, self.password).then(token => {
    client.setAuthInfo('google', token)
    client.setPosition(self.lat, self.lng)
    return client.init()
  }).then(() => {
    console.log('Authenticated, waiting for first map refresh (30s)')
    notifier.notify({
      icon: path.join(__dirname, 'icons/app.png'),
      title: 'Authenticated ' + self.lat + ' ' + self.lng,
      message: 'Waiting for first map refresh (30s)',
      urgency: 'critical'
    })

    setInterval(() => {
      var cellIDs = pogobuf.Utils.getCellIDs(self.lat, self.lng)
      return bluebird.resolve(client.getMapObjects(cellIDs, Array(cellIDs.length).fill(0))).catch(reason => {
        if (~reason.toString().indexOf('code 102')){
          console.log('status code 102, relogging...');

          google = new pogobuf.GoogleLogin()
          client = new pogobuf.Client()

          // Relogin
          google.login(self.username, self.password).then(token => {
            client.setAuthInfo('google', token)
            client.setPosition(self.lat, self.lng)
            client.init()
          }).then(() => {
            console.log('relogged!')
          })
        }
        throw reason;
      }).then(mapObjects => {
        return mapObjects.map_cells
      }).each(cell => {
        // console.log('Cell ' + cell.s2_cell_id.toString())
        // console.log('Has ' + cell.catchable_pokemons.length + ' catchable Pokemon')
        return bluebird.resolve(cell.catchable_pokemons).each(catchablePokemon => {
          // console.log(' - A ' + pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, catchablePokemon.pokemon_id) + ' is asking you to catch it.')

          if (nearbyList.indexOf(catchablePokemon.pokemon_id) == -1) {
            console.log('main.js - There is a ' + pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, catchablePokemon.pokemon_id) + ' near.')
            var icon =  '' + catchablePokemon.pokemon_id
            var pad = '000'
            // console.log(path.join(__dirname, 'icons', pad.substring(0, pad.length - icon.length) + icon + ".png"))
            notifier.notify({
              icon: path.join(__dirname, 'icons', pad.substring(0, pad.length - icon.length) + icon + ".png"),
              title: 'Nearby pokemon',
              message: 'There is a ' + pogobuf.Utils.getEnumKeyByValue(POGOProtos.Enums.PokemonId, catchablePokemon.pokemon_id) + ' near.',
              urgency: 'critical'
            })

            nearbyList.push(catchablePokemon.pokemon_id)
            setTimeout(function () {
              nearbyList.splice(nearbyList.indexOf(catchablePokemon.pokemon_id), 1)
            }, 20 * 60000)
          }
        })
      })
    }, 30 * 1000)
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

module.exports = {
  'username': '',
  'password': '',
  'lat': 0.0,
  'lng': 0.0,
  'start_scanning': start_scanning
}
