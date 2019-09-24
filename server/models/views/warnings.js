class ViewModel {
  constructor (options) {
    const { floods } = options
    Object.assign(this, {
      pageTitle: 'Flood alerts and warnings'
    }, options)

    this.timestamp = Date.now()
    this.floods = floods
  }
}

module.exports = ViewModel
