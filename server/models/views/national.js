class ViewModel {
  constructor (options) {
    const { floods, outlook } = options
    Object.assign(this, {
      pageTitle: 'Flood risk for England',
      metaDescription: 'Check the latest flood risk situation for england and the 5-day flood forecast.',
      metaKeywords: 'flooding, flood risk, flood map, flood warnings, flood alerts, river and sea levels, 5-day flood forecast, gov.uk, england',
      metaCanonical: '/national'

    })
    const activeFloods = floods.floods.filter(flood => flood.severity < 4)
    this.hasActiveFloods = !!activeFloods.length
    this.highestSeverityId = Math.min(...floods.floods.map(flood => flood.severity))
    this.floods = floods._groups
    this.outlook = outlook
    this.timestamp = Date.now()
  }
}

module.exports = ViewModel
