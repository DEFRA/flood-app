class ViewModel {
  constructor (options) {
    const { floods, outlook } = options
    Object.assign(this, {
      pageTitle: 'Flood risk for England'
    })
    const activeFloods = floods.floods.filter(flood => flood.severity < 4)
    this.hasActiveFloods = !!activeFloods.length
    this.floods = floods._groups
    this.outlook = outlook
    this.timestamp = Date.now()
  }
}

module.exports = ViewModel
