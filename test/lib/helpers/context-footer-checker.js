const { parse } = require('node-html-parser')
const { expect } = require('@hapi/code')

function validateFloodlineContactDetails (response) {
  const contextFooterHTML = validateFooterPresent(response)

  expect(contextFooterHTML).to.contain('<header class="govuk-heading-m">Contact Floodline for advice</header>')
  expect(contextFooterHTML).to.contain('<strong>Floodline helpline</strong>')
  expect(contextFooterHTML).to.contain('Telephone: 0345 988 1188')
  expect(contextFooterHTML).to.contain('Textphone: 0345 602 6340')
  expect(contextFooterHTML).to.contain('Open 24 hours a day, 7 days a week')
  expect(contextFooterHTML).to.contain('<a href="https://gov.uk/call-charges">Find out more about call charges</a>')
}

function validateWebChatFooterPresent (response) {
  const contextFooterHTML = validateFooterPresent(response)

  expect(contextFooterHTML).to.contain('<strong>Talk to a Floodline adviser over webchat</strong>')
  expect(contextFooterHTML).to.contain('We\'re running webchat as a trial.')
}

function validateWebChatFooterNotPresent (response) {
  const contextFooterHTML = validateFooterPresent(response)

  expect(contextFooterHTML).to.not.contain('<strong>Talk to a Floodline adviser over webchat</strong>')
  expect(contextFooterHTML).to.not.contain('We\'re running webchat as a trial.')
}

function validateFooterPresent (response) {
  const root = parse(response.payload)
  const asideElement = root.querySelector('aside.defra-context-footer')
  expect(asideElement, 'Aside footer element should exist.').to.exist()
  const contextFooterHTML = asideElement ? asideElement.innerHTML : ''
  return contextFooterHTML
}

module.exports = {
  validateFooterPresent,
  validateFloodlineContactDetails,
  validateWebChatFooterPresent,
  validateWebChatFooterNotPresent
}
