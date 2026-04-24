const { siteUrl } = require('../config')
const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = {
  method: 'GET',
  path: '/cookies',
  handler: async (request, h) => {
    const analyticsCookiesSet = Object.keys(request.state).some(key => /^_ga$|^_gid$|^_gat_gtag_./g.test(key))
    let requestHeadersReferer = request.headers.referer && request.headers.referer.startsWith(siteUrl) ? encodeURI(request.headers.referer) : ''

    if (requestHeadersReferer) {
      // Attempt to ensure valid path structure
      const urlStringArr = requestHeadersReferer.split(siteUrl)
      if (urlStringArr[1] && !urlStringArr[1].startsWith('/') && !siteUrl.endsWith('/')) {
        requestHeadersReferer = ''
      }
    }

    return h.view('cookies', {
      pageTitle: 'Cookies - Check for flooding',
      metaDescription: description,
      referer: requestHeadersReferer,
      analyticsCookiesSet
    })
  }
}
