const { expect } = require('@hapi/code')

function errorMessage (text) {
  return `${text}\n(Call stack: ${new Error().stack})`
}

function attributeChecker (element, name, value) {
  const attribute = element.getAttribute(name)
  expect(attribute, errorMessage(`Attribute ${name} not found on ${element}`)).to.exist()
  expect(attribute, errorMessage(`Attribute ${name} on ${element} does not equal ${value}`)).to.equal(value)
}

// Checks if an anchor with specific text and URL exists among provided anchors
function linkChecker (anchors, targetText, url) {
  const anchor = anchors.find(a => a.text.trim() === targetText)
  expect(anchor, errorMessage(`Anchor ${targetText} not found`)).to.exist()
  // This conditional is here as there are some tests which do not pass in a value for
  // url as it comes from an env var which may change depending on the environment.
  // Once all tests stub out the value of any url rather than take it from env vars
  // then a url should always be passed in and the conditional should not be needed
  if (url) {
    expect(anchor.getAttribute('href'), errorMessage(`Anchor ${targetText} doesn't contain expected URL (${url})`)).to.equal(url)
  } else {
    expect(anchor.getAttribute('href'), errorMessage(`Anchor ${targetText} doesn't contain a URL`)).to.not.be.undefined()
  }
  return anchor
}

//  Verifies that the page contains expected related content links
function fullRelatedContentChecker (root, cyltfrLink) {
  const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
  expect(relatedContentLinks.length, 'Should be 6 related content links').to.equal(6)
  linkChecker(relatedContentLinks, 'Get flood warnings by phone, text or email', 'https://www.gov.uk/sign-up-for-flood-warnings')
  linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
  linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
  linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
  linkChecker(relatedContentLinks, 'Check your long term flood risk', cyltfrLink)
  linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
}

// Checks if a heading with specific text exists
function headingChecker (root, headingLevel, headingText) {
  const h1Found = root.querySelectorAll(headingLevel).some(h => h.textContent.trim() === headingText)
  expect(h1Found, errorMessage(`Heading level ${headingLevel} with text ${headingText} not found.`)).to.be.true()
}

module.exports = {
  headingChecker,
  linkChecker,
  attributeChecker,
  fullRelatedContentChecker
}
