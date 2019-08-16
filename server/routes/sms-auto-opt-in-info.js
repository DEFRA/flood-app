module.exports = {
  method: 'GET',
  path: '/sms-auto-opt-in-info',
  options: {
    description: 'Check your risk of flooding: get current flood warnings, river and sea levels, check the 5-day forecast or use flood risk maps',
    handler: {
      view: {
        template: 'sms-auto-opt-in-info',
        context: {
          pageTitle: 'This phone number has been automatically opted-in to receive flood warnings - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
