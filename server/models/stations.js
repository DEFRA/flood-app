class Stations {
  constructor (data) {
    this._stations = data[0]
    this._rivers = data[1]
    this._processStations()
  }

  // getters & setters
  get riverNames () {
    return this._rivers
  }

  set stations (data) {
    this._stations = data
    this._processStations()
  }

  get stations () {
    return this._groupedStations
  }

  // Methods
  _processStations () {
    const groundwater = {
      id: 'groundwater',
      name: 'Groundwater Levels',
      stations: []
    }
    const coastal = {
      id: 'coastal',
      name: 'Sea Levels',
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
          stations: river.levelIds.flatMap(station => { // flatMap to take into account arrays returned from getStationsById (to accomodate multi stations)
            const stations = this.getStationsById(station.replace('stations.', ''))
            stations.forEach(station => {
              station.processed = true
            })
            return stations
          })
        }
      })

    // Extract the groundwater && coastal stations && orphaned stations
    this._stations.forEach(station => {
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

    this._groupedStations = {
      'Sea Levels': coastal,
      'Groundwater Levels': groundwater,
      ...rivers
    }
  }

  getStationsById (id) {
    return this._stations.filter(station => { return station.rloi_id === parseInt(id) })
  }

  getStationsByRiver (riverName) {
    return this._groupedStations.rivers.filter(river => river.name === riverName)
  }

  getStationByIdWithRelations (id) {
    throw new Error('not implemented')
  }

  getStationRelations (id) {
    throw new Error('not implemented')
  }

  getStationsWithin (bbox) {
    // Get the stations from within bounding box in code (using turf), see if more performant than database work.
    throw new Error('not implemented')
  }
}

module.exports = Stations
