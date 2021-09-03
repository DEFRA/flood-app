module.exports = {
  method: 'GET',
  path: '/accessibility-statement',
  options: {
    description: 'Accessibility Statement - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'accessibility-statement',
        context: {
          pageTitle: 'Accessibility Statement - Flood information service - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
