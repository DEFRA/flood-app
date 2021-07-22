const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = {
  method: 'GET',
  path: '/cookies',
  handler: async (request, h) => {
    let analyticsCookiesSet = false
    if (request.state._ga && request.state._gat && request.state._gid) {
      analyticsCookiesSet = true
    }
    return h.view('cookies', {
      pageTitle: 'Cookies - Flood information service - GOV.UK',
      heading: 'Flood information service',
      metaDescription: description,
      analyticsCookiesSet: analyticsCookiesSet
    })
  }
}
