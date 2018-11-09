const hoek = require('hoek')
const BaseViewModel = require('.')
const severity = require('../severity')

class ViewModel extends BaseViewModel {
  constructor (options) {
    const { area, flood } = options
    const severityLevel = flood && severity[flood.severity - 1]

    super(hoek.applyToDefaults({
      pageTitle: `Flood information for ${area.description} - GOV.UK`,
      severity: severityLevel
    }, options))
  }
}

module.exports = ViewModel
