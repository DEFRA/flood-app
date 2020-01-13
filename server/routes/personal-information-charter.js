const description = 'What data is collected when you use GOV.UK - how it\'s used, where it\'s stored, your rights.'

module.exports = {
  method: 'GET',
  path: '/personal-information-charter',
  options: {
    description: 'Personal information charter - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'personal-information-charter',
        context: {
          pageTitle: 'Personal information charter - Flood information service - GOV.UK',
          metaDescription: description,
          ogDescription: description,
          feedback: false
        }
      }
    }
  }
}
