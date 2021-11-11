const description = 'This page explains the terms and conditions for using this site, our linking policy and the disclaimers attached to the information.'

module.exports = {
  method: 'GET',
  path: '/terms-and-conditions',
  options: {
    description: 'Terms and conditions',
    handler: {
      view: {
        template: 'terms-and-conditions',
        context: {
          pageTitle: 'Terms and conditions - Check for flooding',
          metaDescription: description,
          ogDescription: description
        }
      }
    }
  }
}
