class Stations {
  constructor (data) {
    this._stations = data[0]
    this._rivers = data[1]
    this._groupedStations = this.processStations(this._stations)
  }

  // getters & setters
  get riverNames () {
    return this._rivers
  }

  set stations (data) {
    this._stations = data
    this._groupedStations = this.processStations(this._stations)
  }

  get stations () {
    return this._groupedStations
  }

  get stationsClone () {
    return JSON.parse(JSON.stringify(this._groupedStations))
  }

  // Methods
  processStations (rawStations) {
    const groundwater = {
      id: 'Groundwater Levels',
      name: 'Groundwater Levels',
      'non-navigable': true,
      stations: []
    }
    const coastal = {
      id: 'Sea Levels',
      name: 'Sea Levels',
      'non-navigable': true,
      stations: []
    }

    const rivers = {}
    // Organise rivers into id keyed objects
    this._rivers
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(river => {
        rivers[river.id] = {
          id: river.id,
          name: river.name,
          stations: river.stations.flatMap(station => { // flatMap to take into account arrays returned from getStationsById (to accomodate multi stations)
            const stations = rawStations.filter(s => { return s.rloi_id === parseInt(station.replace('stations.', '')) })
            for (station in stations) {
              if (!rawStations.some(s => s.rloi_id === stations[station].rloi_id)) {
                delete stations[station]
              } else {
                stations[station].processed = true
              }
            }
            return stations
          })
        }
      })

    // Extract the groundwater && coastal stations && orphaned stations
    rawStations.forEach(station => {
      if (!station.processed) {
        station.processed = true
        switch (station.station_type.toLowerCase()) {
          case 'c':
            coastal.stations.push(station)
            break
          case 'g':
            groundwater.stations.push(station)
            break
          default:
            // What to do with orphans?
            if (rivers[`orphaned-${station.wiski_river_name}`]) {
              rivers[`orphaned-${station.wiski_river_name}`].stations.push(station)
            } else {
              rivers[`orphaned-${station.wiski_river_name}`] = {
                id: `orphaned-${station.wiski_river_name}`,
                name: station.wiski_river_name,
                'non-navigable': true,
                stations: [station]
              }
            }
        }
      }
    })

    // sort the arrays
    coastal.stations.sort((a, b) => a.external_name.localeCompare(b.external_name))
    groundwater.stations.sort((a, b) => a.external_name.localeCompare(b.external_name))

    return {
      'Sea Levels': coastal,
      'Groundwater Levels': groundwater,
      ...rivers
    }
  }

  getStationsById (id) {
    return this._stations.filter(station => { return station.rloi_id === parseInt(id) })
  }

  getStationsByRiverClone (riverName) {
    return {
      [riverName]: JSON.parse(JSON.stringify(this._groupedStations[riverName]))
    }
  }

  getStationByIdWithRelations (id, direction) {
    const data = {
      upDown: {
        id: `stations.${id}`,
        upstream: [],
        downstream: []
      }
    }
    Object.keys(this._groupedStations).forEach(key => {
      this._groupedStations[key].stations.forEach((station, i) => {
        // Find matching upstream station, as only upstream on the map
        if (station.rloi_id === parseInt(id) && station.qualifier === 'u') {
          // only returned data if the object is navigable
          if (!this._groupedStations[key]['non-navigable']) {
            // get upstream if exists
            if (this._groupedStations[key].stations[i - 1]) {
              // if upstream station is same rloi_id (multi stations) then move to next gauge
              if (this._groupedStations[key].stations[i - 1].rloi_id === parseInt(id)) {
                if (this._groupedStations[key].stations[i - 2]) {
                  data.upDown.upstream.push({
                    id: `stations.${this._groupedStations[key].stations[i - 2].rloi_id}`,
                    river: this._groupedStations[key].name
                  })
                }
              } else {
                data.upDown.upstream.push({
                  id: `stations.${this._groupedStations[key].stations[i - 1].rloi_id}`,
                  river: this._groupedStations[key].name
                })
              }
            }

            // get downstream if exists
            if (this._groupedStations[key].stations[i + 1]) {
              // if downstream station is same rloi_id (multi stations) then move to next gauge
              if (this._groupedStations[key].stations[i + 1].rloi_id === parseInt(id)) {
                if (this._groupedStations[key].stations[i + 2]) {
                  data.upDown.downstream.push({
                    id: `stations.${this._groupedStations[key].stations[i + 2].rloi_id}`,
                    river: this._groupedStations[key].name
                  })
                }
              } else {
                data.upDown.downstream.push({
                  id: `stations.${this._groupedStations[key].stations[i + 1].rloi_id}`,
                  river: this._groupedStations[key].name
                })
              }
            }
          }
        }
      })
    })
    return data
  }

  getRiverByStationId (id) {
    let river = {}
    Object.keys(this._groupedStations).forEach(key => {
      this._groupedStations[key].stations.forEach(station => {
        if (station.rloi_id === parseInt(id)) {
          river = this._groupedStations[key]
        }
      })
    })

    return river
  }
}

module.exports = Stations
