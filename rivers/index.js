const fs = require('fs')
const dataRivers = require('./rivers.json')
const dataStations = require('./stations.json')
const path = './rivers/output.json'
var stations = []

// Process stations
dataStations.features.forEach((feature) => {
  // Find the station in its own river
  var river = dataRivers.find(x => JSON.stringify(x.stations).includes(JSON.stringify({
    "id": feature.id,
    "type": ""
  })))
  stations.push({
    'id': feature.id,
    'name': feature.properties.name,
    'river': river ? river.name : feature.properties.river,
    'riverId': river ? river.id : '',
    'upstream': feature.properties.upstream = [],
    'downstream': feature.properties.downstream = []
  })
})

// Add all upstream and downstream id's to stations within the same rivers
dataRivers.forEach((river) => {
  var stationRefs = river.stations
  stationRefs.forEach((stationRef) => {
    var station = stations.find(x => x.id === stationRef.id)
    // Check for valid station on this river
    if (station && stationRef.type !== 'T') {
      // Get position in river
      var position = stationRefs.indexOf(stationRef)
      // Add all upstream stations
      if (position > 0) {
        var upstreamStations = []
        for (var i = (position - 1); i >= 0; i--) {
          var nextUpstream = stations.find(x => x.id === stationRefs[i].id)
          if (nextUpstream) {
            upstreamStations.push({
              'id': nextUpstream.id,
              'river': nextUpstream.river,
              'isTrib': stationRefs[i].type === 'T' ? true : false
            }) 
          } else {
            console.log('Error: Upstream ' + stationRefs[i].id + ' missing.')
          }
          // Break when we have the next station on the same river
          if (stationRefs[i].type === '') {
            break
          }
        }
        // Reverse array and set upstream collection
        station.upstream = upstreamStations.reverse()
      }
      // Add all downstream stations
      if (position < (stationRefs.length - 1)) {
        var downstreamStations = []
        for (i = (position + 1); i < stationRefs.length; i++) {
          var nextDownstream = stations.find(x => x.id === stationRefs[i].id)
          if (nextDownstream) {
            if (stationRefs[i].type !== 'T') {
              downstreamStations.push({
                'id': nextDownstream.id,
                'river': nextDownstream.river
              })
              // Break when we have the next station that is not a tributary
              break
            }
          } else {
            console.log('Error: Downstream ' + stationRefs[i].id + ' missing.')
          }
        }
        // Array already n correct order
        station.downstream = downstreamStations
      }
    }
  })
})

// Add larger river id's at the bottom of tributary rivers
dataRivers.forEach((river) => {
  var stationRefs = river.stations
  // Iterate over tributaries
  stationRefs.forEach((stationRef) => {
    if (stationRef.type === 'T') {
      var position = stationRefs.indexOf(stationRef)
      var stationToUpdate = stations.find(x => x.id === stationRef.id)
      for (i = (position + 1); i < stationRefs.length; i++) {
        if (stationRefs[i].type !== 'T') {
          var nextDownstream = stations.find(x => x.id === stationRefs[i].id)
          stationToUpdate.downstream.push({
            'id': nextDownstream.id,
            'river': nextDownstream.river
          })
          // Break when we have the next station that is not a tributary
          break
        }
      }
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
