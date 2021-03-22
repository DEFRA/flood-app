const schedule = require('node-schedule')
const floodService = require('../services/flood')

module.exports = {
  plugin: {
    name: 'data-schedule',
    register: async () => {
      // Schedule warnings data
      const getFloods = async () => {
        floodService.floods = await floodService.getFloods()
        console.log('Floods cached')
      }
      // get stations geojson data from geoserver
      const getStationsGeojson = async () => {
        floodService.stationsGeojson = await floodService.getStationsGeoJson()
        console.log('Stations geojson cached')
      }
      // get rainfall geojson from geoserver
      const getRainfallGeojson = async () => {
        floodService.rainfallGeojson = await floodService.getRainfallGeojson()
        console.log('Rainfall geojson cached')
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
        // Chain 15 min jobs so we don't overload
        await getStationsGeojson()
        await getRainfallGeojson()
        await getOutlook()
      })

      // Start up
      console.log('Caching data please wait...')
      // On startup just hit all loads at once
      await Promise.all([
        getFloods(),
        getOutlook(),
        getStationsGeojson(),
        getRainfallGeojson()
      ])

      console.log('Data cache complete.')
    }
  }
}
