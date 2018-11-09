const hoek = require('hoek')
const BaseViewModel = require('.')

const defaults = {
  pageTitle: `Outlook for England - GOV.UK`,
  metadata: {
    keywords: '...',
    description: '...'
  }
}

class ViewModel extends BaseViewModel {
  constructor (options) {
    super(hoek.applyToDefaults(defaults, options))
  }
}

module.exports = ViewModel
