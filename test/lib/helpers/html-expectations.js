const { expect } = require('@hapi/code')
// const floodRiskUrl = process.env.FLOOD_RISK_URL

// Checks if an anchor with specific text and URL exists among provided anchors
function linkChecker (anchors, targetText, url) {
  const anchor = anchors.find(a => a.text.trim() === targetText)
  expect(anchor, `Anchor ${targetText} not found`).to.exist()
  expect(anchor.getAttribute('href'), `Anchor ${targetText} doesn't contain expected URL (${url})`).to.equal(url)
}

//  Verifies that the page contains expected related content links
function fullRelatedContentChecker (root) {
  const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
  expect(relatedContentLinks.length, 'Should be 6 related content links').to.equal(6)
  linkChecker(relatedContentLinks, 'Get flood warnings by phone, text or email', 'https://www.gov.uk/sign-up-for-flood-warnings')
  linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
  linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do')
  linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
  // linkChecker(relatedContentLinks, 'Check your long term flood risk', floodRiskUrl)
  linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
}

module.exports = {
  linkChecker,
  fullRelatedContentChecker
}
