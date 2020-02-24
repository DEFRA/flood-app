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
    const orphaned = []
    const groundwater = []
    const coastal = []
    const rivers = this._rivers
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(river => {
        return {
          id: river.id,
          name: river.name,
          stations: river.levelIds.flatMap(station => { // flatMap to take into account arrays returned from getStationsById (to accomodate multi stations)
            return this.getStationsById(station.replace('stations.', ''))
          })
        }
      })
    // set stations to processed that had a matching river relationship
    rivers.forEach(river => {
      river.stations.forEach(station => {
        station.processed = true
      })
    })

    // Extract the groundwater && coastal stations && orphaned stations
    this._stations.forEach(station => {
      if (!station.processed) {
        switch (station.station_type.toLowerCase()) {
          case 'c':
            coastal.push(station)
            break
          case 'g':
            groundwater.push(station)
            break
          default:
            orphaned.push(station)
        }
      }
    })

    orphaned.sort((a, b) => a.external_name.localeCompare(b.external_name))

    this._groupedStations = {
      Orphaned: orphaned.sort((a, b) => a.external_name.localeCompare(b.external_name)),
      Coastal: coastal.sort((a, b) => a.external_name.localeCompare(b.external_name)),
      Groundwater: groundwater.sort((a, b) => a.external_name.localeCompare(b.external_name)),
      rivers
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
