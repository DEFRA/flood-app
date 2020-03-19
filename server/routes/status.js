const floodService = require('../services/flood')

module.exports = {
  method: 'GET',
  path: '/status',
  handler: async (request, h) => {
    const model = {
      now: new Date(),
      pageTitle: 'Status',
      fwisDate: new Date(parseInt(floodService.floods.timestamp) * 1000),
      fwisAgeMinutes: parseInt((new Date() - new Date(parseInt(floodService.floods.timestamp) * 1000)) / (1000 * 60)),
      fwisCount: floodService.floods.floods.length || 0,
      outlookTimestamp: new Date(floodService.outlook.timestampOutlook),
      outlookAgeHours: parseInt((new Date() - new Date(floodService.outlook.timestampOutlook)) / (1000 * 60 * 60))
    }
    return h.view('status', model)
  }
}
