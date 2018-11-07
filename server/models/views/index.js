const hoek = require('hoek')

const context = {
  pageTitle: 'Check flood risk - GOV.UK'
}

class ViewModel {
  constructor (options) {
    hoek.merge(this, options, context)
  }
}

module.exports = ViewModel
