// const joi = require('@hapi/joi')
// const boom = require('@hapi/boom')
// const ViewModel = require('../models/views/station')
// const additionalWelshStations = [4162, 4170, 4173, 4174, 4176]
// const { nrwStationUrl } = require('../config')

module.exports = {
  method: 'GET',
  path: '/rainfall-station',
  handler: async (request, h) => {
    // const { id } = request.params

    // Non-forecast Station
    // const model = new ViewModel({ station, telemetry, impacts, river, warningsAlerts })
    return h.view('rainfall-station')
  }
}
