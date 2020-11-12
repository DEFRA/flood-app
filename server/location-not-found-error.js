class LocationNotFoundError extends Error {
  constructor (mesage) {
    super(mesage)
    this.name = 'LocationNotFoundError'
  }
}

module.exports = LocationNotFoundError
