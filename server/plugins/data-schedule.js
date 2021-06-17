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

      // Schedules
      schedule.scheduleJob('* * * * *', async () => {
        await getFloods()
      })

      // Start up
      console.log('Caching data please wait...')
      await getFloods()
      console.log('Data cache complete.')
    }
  }
}
