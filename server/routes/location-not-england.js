module.exports = {
  method: 'GET',
  path: '/location-not-england',
  options: {
    description: 'location-not-england - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'location-not-england',
        context: {
          pageTitle: 'This service provides flood warning information for England only',
          heading: 'Flood information service'
        }
      }
    }
  }
}
