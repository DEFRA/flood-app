module.exports = {
  method: 'GET',
  path: '/consent',
  options: {
    description: 'Consent - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'consent',
        context: {
          pageTitle: 'Give your consent before using the flood information service prototype',
          heading: 'Flood information service'
        }
      }
    }
  }
}
