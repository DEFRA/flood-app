module.exports = {
  method: 'GET',
  path: '/sms-auto-opt-in-info',
  options: {
    handler: {
      view: {
        template: 'sms-auto-opt-in-info',
        context: {
          pageTitle: 'This phone number has been automatically opted-in to receive flood warnings'
        }
      }
    }
  }
}
