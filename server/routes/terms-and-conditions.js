const description = 'This page explains the terms and conditions for using this site, our linking policy and the disclaimers attached to the information.'

module.exports = {
  method: 'GET',
  path: '/terms-and-conditions',
  options: {
    description: 'Terms and conditions - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'terms-and-conditions',
        context: {
          pageTitle: 'Terms and conditions - Flood information service - GOV.UK',
          metaDescription: description,
          ogDescription: description
        }
      }
    }
  }
}
