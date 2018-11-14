const hoek = require('hoek')
const NationalViewModel = require('./national')

const defaults = {
  metadata: {
    keywords: '...',
    description: '...'
  }
}

class ViewModel extends NationalViewModel { // Inherit from National for now, Base eventually
  constructor ({ place, floods }) {
    const title = place.name

    super(hoek.applyToDefaults(defaults, {
      place,
      floods,
      location: title,
      pageTitle: `${title} flood risk - GOV.UK`
    }))
  }
}

module.exports = ViewModel
