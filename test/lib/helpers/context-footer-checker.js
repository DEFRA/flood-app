const { parse } = require('node-html-parser')

function validateFloodlineContactDetails (response) {
  const contextFooterHTML = validateFooterPresent(response)

  expect(contextFooterHTML).toContain('<header class="govuk-heading-m">Contact Floodline for advice</header>')
  expect(contextFooterHTML).toContain('<strong>Floodline helpline</strong>')
  expect(contextFooterHTML).toContain('Telephone: 0345 988 1188')
  expect(contextFooterHTML).toContain('Textphone: 0345 602 6340')
  expect(contextFooterHTML).toContain('Open 24 hours a day, 7 days a week')
  expect(contextFooterHTML).toContain('<a href="https://gov.uk/call-charges">Find out more about call charges</a>')
}

function validateWebChatFooterPresent (response) {
  const contextFooterHTML = validateFooterPresent(response)

  expect(contextFooterHTML).toContain('<strong>Talk to a Floodline adviser over webchat</strong>')
  expect(contextFooterHTML).toContain('We\'re running webchat as a trial.')
}

function validateWebChatFooterNotPresent (response) {
  const contextFooterHTML = validateFooterPresent(response)

  expect(contextFooterHTML).not.toContain('<strong>Talk to a Floodline adviser over webchat</strong>')
  expect(contextFooterHTML).not.toContain('We\'re running webchat as a trial.')
}

function validateFooterPresent (response) {
  const root = parse(response.payload)
  const asideElement = root.querySelector('aside.defra-context-footer')
  expect(asideElement).not.toBeNil()
  const contextFooterHTML = asideElement ? asideElement.innerHTML : ''
  return contextFooterHTML
}

module.exports = {
  validateFooterPresent,
  validateFloodlineContactDetails,
  validateWebChatFooterPresent,
  validateWebChatFooterNotPresent
}
