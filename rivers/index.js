const fs = require('fs')
const dataRivers = require('./rivers.json')
const dataStations = require('./stations.json')
const path = './rivers/output.json'
var stations = []

// Process stations
dataStations.features.forEach((feature) => {
  // Find the station in its own river
  var river = dataRivers.find(x => JSON.stringify(x.stations).includes({
    "id": feature.id,
    "type": ""
  }))
  stations.push({
    'id': feature.id,
    'name': feature.properties.name,
    'river': river ? river.name : feature.properties.river,
    'riverId': river ? river.id : '',
    'upstream': feature.properties.upstream = [],
    'downstream': feature.properties.downstream = []
  })
})

// Add upstream/downstream and id's to stations within the same rivers
dataRivers.forEach((river) => {
  var stationIds = river.stationIds
  stationIds.forEach((stationId) => {
    var station = stations.find(x => x.id === stationId)
    // Add upstream/downstream station id's but exclude tributary river id's
    if (station) {
      var position = stationIds.indexOf(stationId)
      // Add first upstream station (none river)
      if (position > 0) {
        for (var i = (position - 1); i >= 0; i--) {
          var upstreamStation = stations.find(x => x.id === stationIds[i])
          if (upstreamStation) {
            station.upstream.push({
              'id': upstreamStation.id,
              'river': upstreamStation.river,
              'isSameRiver': upstreamStation.riverId === river.id || false
            })
            break
          }
        }
      }
      // Add first downstream station (none river)
      if (position < stationIds.length - 1) {
        for (i = position; i < stationIds.length - 1; i++) {
          var downstreamStation = stations.find(x => x.id === stationIds[i + 1])
          if (downstreamStation) {
            station.downstream.push({
              'id': downstreamStation.id,
              'river': downstreamStation.river,
              'isSameRiver': downstreamStation.riverId === river.id || false
            })
            break
          }
        }
      }
    }
  })
})

// Add upstream/downstream tributary/main river id's to stations in different rivers
dataRivers.forEach((river) => {
  var stationIds = river.stationIds
  var tributaryStartPosition = -1
  stationIds.forEach((stationId, index) => {
    // Joins a main river. Get station before river id and update its downstream array
    if (index === stationIds.length - 1 && !stationId.includes('stations.')) {
      var stationIdtoUpdate = stationIds[stationIds.length - 2]
      var tributaryRiverId = river.id
      var mainRiverId = stationId
      // Get the main river
      var mainRiver = dataRivers.find(x => x.id === mainRiverId)
      tributaryStartPosition = mainRiver.stationIds.indexOf(tributaryRiverId)
      // Get first downstream station after tributary start
      for (var i = tributaryStartPosition; i < mainRiver.stationIds.length - 1; i++) {
        if (mainRiver.stationIds[i].includes('stations.')) {
          var entryStationId = mainRiver.stationIds[i]
          // We have entry point in the main river
          var tributaryStation = stations.find(x => x.id === stationIdtoUpdate)
          // Update river station
          tributaryStation.downstream.push({
            'id': entryStationId,
            'river': mainRiver.name,
            'isSameRiver': true
          })
          break
        }
      }
    // Start of a tributary. Get previous station and update its upstream array
    } else if (stationId.includes('river')) {
      // Get tributary river last station id
      var tributaryRiver = dataRivers.find(x => x.id === stationId)
      var tributaryLastStationId = tributaryRiver.stationIds[tributaryRiver.stationIds.length - 2]
      // Get the tributary start position in the main river
      tributaryStartPosition = index
      // Get first downstream station in main river
      var downstreamStationId = ''
      for (i = tributaryStartPosition; i < stationIds.length - 1; i++) {
        var downstreamStation = stations.find(x => x.id === stationIds[i + 1])
        if (downstreamStation) {
          downstreamStationId = stationIds[i + 1]
          break
        }
      }
      // Add this id to tributary rivers last station
      var mainStation = stations.find(x => x.id === downstreamStationId)
      // Update downstream station with new upstream id
      mainStation.upstream.push({
        'id': tributaryLastStationId,
        'river': tributaryRiver.name,
        'isSameRiver': true
      })
    }
  })
})

// Post process stations
stations.forEach((station) => {
  delete station.name
  delete station.river
  delete station.riverId
})

fs.writeFile(path, JSON.stringify(stations), 'utf8', function (err) {
  if (err) {
    return console.log('Error')
  }
  console.log('Success')
})
