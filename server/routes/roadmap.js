module.exports = {
  method: 'GET',
  path: '/roadmap',
  options: {
    description: 'Roadmap - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'roadmap',
        context: {
          pageTitle: 'Roadmap - Flood information service - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
