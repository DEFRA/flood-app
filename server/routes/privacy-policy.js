const description = 'What data is collected when you use GOV.UK - how it\'s used, where it\'s stored, your rights.'

module.exports = {
  method: 'GET',
  path: '/privacy-policy',
  options: {
    description: 'Privacy policy - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'privacy-policy',
        context: {
          pageTitle: 'Privacy policy - Flood information service - GOV.UK',
          metaDescription: description,
          ogDescription: description,
          feedback: false
        }
      }
    }
  }
}
