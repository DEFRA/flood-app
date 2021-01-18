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
      // get stations geojson data for map
      const getStationsGeojson = async () => {
        floodService.stationsGeojson = await floodService.getStationsGeoJson()
        console.log('Stations geojson cached')
      }
      // get outlook (5df) data
      const getOutlook = async () => {
        floodService.outlook = await floodService.getOutlook()
        console.log('Outlook cached')
      }

      // Schedules
      schedule.scheduleJob('* * * * *', async () => {
        await getFloods()
      })

      schedule.scheduleJob('1,16,31,46 * * * *', async () => {
        await getStationsGeojson()
      })

      schedule.scheduleJob('1,16,31,46 * * * *', async () => {
        await getOutlook()
      })

      // Start up
      console.log('Caching data please wait...')
      await Promise.all([
        getFloods(),
        getOutlook(),
        getStationsGeojson()
      ])

      console.log('Data cache complete.')
    }
  }
}
