const description = 'The Environment Agency collects information or data about you when you use this service. This notice explains how we handle this information.'

module.exports = {
  method: 'GET',
  path: '/privacy-notice',
  options: {
    description: 'Privacy notice',
    handler: {
      view: {
        template: 'privacy-notice',
        context: {
          pageTitle: 'Privacy notice - Check for flooding',
          metaDescription: description,
          ogDescription: description
        }
      }
    }
  }
}
