class ViewModel {
  constructor (options) {
    const { floods, outlook } = options
    Object.assign(this, {
      pageTitle: 'Flood risk for England'
    }, options)

    this.timestamp = Date.now()
    this.floods = floods

    const activeFloods = floods.floods.filter(flood => flood.severity < 4)
    this.floods._hasActiveFloods = !!activeFloods.length

    this.outlook = outlook
  }
}

module.exports = ViewModel
