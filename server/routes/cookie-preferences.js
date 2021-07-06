const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = {
  method: 'GET',
  path: '/cookie-preferences',
  options: {
    description: 'Cookies - Check for flooding - GOV.UK',
    handler: {
      view: {
        template: 'cookie-prefences',
        context: {
          pageTitle: 'Set cookie preferences - Check for flooding - GOV.UK',
          heading: 'Check for flooding',
          metaDescription: description,
          ogDescription: description
        }
      }
    }
  }
}
