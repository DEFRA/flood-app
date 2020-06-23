
class ViewModel {
  constructor ({ location, err }) {
    Object.assign(this, {
      location,
      err,
      pageTitle: err.errorMessage || err.message ? 'Error: Find location - Check for flooding near you' : 'Find location - Check for flooding'
    })

    this.errorSummary = {
      titleText: 'There is a problem',
      errorList: [
        {
          text: 'Enter a real town, city or postcode',
          href: '#location'
        }
      ]
    }

    this.locationInput = {
      label: {
        text: 'Town, city or postcode'
      },
      id: 'location',
      name: 'location',
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        maxlength: 200,
        spellcheck: 'false'
      },
      classes: 'govuk-!-width-one-half'
    }

    if (err.errorMessage || err.message) {
      this.locationInput.errorMessage = { text: 'Enter a real town, city or postcode' }
      this.locationInput.value = location
    }
  }
}

module.exports = ViewModel
