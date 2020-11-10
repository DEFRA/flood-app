class LocationSearchError extends Error {
  constructor (message) {
    super(message)
    this.name = 'LocationSearchError'
  }
}

module.exports = LocationSearchError
