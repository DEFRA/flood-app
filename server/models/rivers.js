class Rivers {
  constructor (rivers, stationsGeojson) {
    this._rivers = rivers.sort((a, b) => {
      return a.name < b.name ? -1 : 1
    })
    this._riverNames = rivers.map(river => { return river.name })
    this._stationsGeojson = stationsGeojson
  }

  // Getters & Setters
  set stationsGeojson (data) {
    this._stationsGeojson = data
    // this._river = this.getRiverByName('River Ouse')
  }

  get riverNames () {
    return this._riverNames
  }

  // Methods

  getStationById (id) {
    return this._stationsGeojson.features.find(feature => { return feature.id === `stations.${id}` })
  }

  getRiverByName (riverName) {
    // This returns the matched rivers but also maps and populates the station data
    return this._rivers
      .filter(river => river.name === riverName)
      .map(item => {
        return {
          id: item.id,
          name: item.name,
          stations: item.levelIds.map(station => {
            return this.getStationById(station.replace('stations.', ''))
          })
        }
      })
  }


  getStationByIdWithRelations (id) {
    return 'not implemented'
  }

  getStationRelations (id) {
    return 'not implemented'
  }

  // Helper functions for the class

  getStationsWithin (bbox) {
    // Get the stations from within bounding box in code, see if more performant than database work.
    return 'not implemented'
  }
}

module.exports = Rivers
