module.exports = {
  method: 'GET',
  path: '/start-page',
  options: {
    description: 'start-page - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'start-page',
        context: {
          pageTitle: 'Check if a location in England is at risk of flooding now',
          heading: 'Flood information service',
          model: {
            metaDescription: 'Check if a location in England is at risk of flooding. View latest flood warnings and alerts, and the flood forecast for the next 5 days. Also check the latest river, sea, groundwater and rainfall levels.'
          }
        }
      }
    }
  }
}
