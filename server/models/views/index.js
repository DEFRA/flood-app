const hoek = require('hoek')

const context = {
  pageTitle: 'Check flood risk - GOV.UK',
  metadata: {
    keywords: 'flood,gov.uk,england',
    description: 'Check your risk of flooding: get current flood warnings, river and sea levels, check the 5-day forecast or use flood risk maps'
  }
}

class ViewModel {
  constructor (options) {
    hoek.merge(this, options, context)
  }
}

module.exports = ViewModel
