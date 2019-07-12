class NationalViewModel {
  constructor (options) {
    const { floods, outlook } = options
    Object.assign(this, {
      pageTitle: `Flood risk for England`
    }, options)

    this.timestamp = Date.now()
    this.floods = floods
    this.outlook = outlook
  }
}

module.exports = NationalViewModel
