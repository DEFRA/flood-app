const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = {
  method: 'GET',
  path: '/cookies',
  handler: async (request, h) => {
    const analyticsCookiesSet = Object.keys(request.state).some((key) => {
      return /^_ga$|^_gid$|^_gat_gtag_./g.test(key)
    })
    return h.view('cookies', {
      pageTitle: 'Cookies - Flood information service - GOV.UK',
      heading: 'Flood information service',
      metaDescription: description,
      analyticsCookiesSet: analyticsCookiesSet,
      referer: request.headers.referer || ''
    })
  }
}
