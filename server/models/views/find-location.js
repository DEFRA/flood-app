
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
          text: 'Enter a town, city or postcode',
          href: '#location'
        }
      ]
    }

    this.locationInput = {
      label: {
        text: 'Where do you want to check?',
        classes: 'govuk-label--l',
        isPageHeading: true
      },
      hint: {
        text: 'Town, city or postcode in England'
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

    if (location) {
      this.locationInput.value = location
    }

    if (err.errorMessage || err.message) {
      this.locationInput.errorMessage = { text: 'Enter a town, city or postcode' }
      this.locationInput.value = location
    }
  }
}

module.exports = ViewModel
