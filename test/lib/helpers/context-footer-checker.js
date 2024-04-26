const { parse } = require('node-html-parser')
const { expect } = require('@hapi/code')

function validateFooterContent (response, config) {
  const root = parse(response.payload)
  const asideElement = root.querySelector('aside.defra-context-footer')
  expect(asideElement, 'Aside element should exist in the footer.').to.exist()

  const contextFooterHTML = asideElement ? asideElement.innerHTML : ''

  expect(contextFooterHTML).to.contain('<header class="govuk-heading-m">Contact Floodline for advice</header>')
  expect(contextFooterHTML).to.contain('<strong>Floodine helpline</strong>')
  expect(contextFooterHTML).to.contain('Telephone: 0345 988 1188')
  expect(contextFooterHTML).to.contain('Textphone: 0345 602 6340')
  expect(contextFooterHTML).to.contain('Open 24 hours a day, 7 days a week')
  expect(contextFooterHTML).to.contain('<a href="https://gov.uk/call-charges">Find out more about call charges</a>')

  // Check for the presence of "Talk to a Floodline adviser over webchat" only if webchat is enabled
  if (config.webchat.enabled) {
    expect(contextFooterHTML).to.contain('<strong>Talk to a Floodline adviser over webchat</strong>')
    expect(contextFooterHTML).to.contain('We\'re running webchat as a trial.')
  }
}

module.exports = {
  validateFooterContent
}
