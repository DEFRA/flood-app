const schedule = require('node-schedule')
const floodService = require('../services/flood')

module.exports = {
  plugin: {
    name: 'data-schedule',
    register: async (server, options) => {
      // Schedule warnings data
      const getFloods = async () => {
        floodService.floods = await floodService.getFloods()
        console.log('Floods cached')
      }
      // first seed the data on startup
      await getFloods()
      schedule.scheduleJob('* * * * *', async () => {
        await getFloods()
      })

      // Schedule telemetry data
      // const getTelemetry = () => {
      //   console.log('Telemetry scheduled job')
      // }
      // getTelemetry()
      // schedule.scheduleJob('* * * * *', getTelemetry)

      // Schedule outlook (5df) data
      const getOutlook = async () => {
        floodService.outlook = await floodService.getOutlook()
        console.log('Outlook cached')
      }
      // awaiting getOutlook delays the application startup
      await getOutlook()
      schedule.scheduleJob('*/15 * * * *', async () => {
        await getOutlook()
      })
    }
  }
}
