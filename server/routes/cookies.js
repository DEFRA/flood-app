const { siteUrl } = require('../config')
const description = 'The Environment Agency uses cookies to collect data about how users browse the site. This page explains what they do and how long they stay on your device.'

module.exports = {
  method: 'GET',
  path: '/cookies',
  handler: async (request, h) => {
    const analyticsConsent = request.state.set_cookie_usage === 'true'
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
      analyticsCookiesSet: analyticsConsent
    })
  }
}
