module.exports = {
  method: 'GET',
  path: '/location-error',
  options: {
    description: 'location-error - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'location-error',
        context: {
          pageTitle: 'This service provides flood warning information for England only',
          heading: 'Flood information service'
        }
      }
    }
  }
}
