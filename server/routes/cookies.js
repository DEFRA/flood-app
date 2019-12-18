const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = {
  method: 'GET',
  path: '/cookies',
  options: {
    description: 'Cookies - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'cookies',
        context: {
          pageTitle: 'Cookies - Flood information service - GOV.UK',
          heading: 'Flood information service',
          metaDescription: description,
          ogDescription: description
        }
      }
    }
  }
}
