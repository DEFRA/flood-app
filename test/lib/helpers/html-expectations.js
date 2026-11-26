// Checks if an anchor with specific text and URL exists among provided anchors
function linkChecker (anchors, targetText, url) {
  // Jest's expect takes a single argument, so the context is carried in the compared values
  expect(Array.from(anchors, a => a.text.trim())).toContain(targetText)
  const anchor = Array.from(anchors).find(a => a.text.trim() === targetText)
  // This conditional is here as there are some tests which do not pass in a value for
  // url as it comes from an env var which may change depending on the environment.
  // Once all tests stub out the value of any url rather than take it from env vars
  // then a url should always be passed in and the conditional should not be needed
  if (url) {
    expect({ anchor: targetText, href: anchor.getAttribute('href') }).toEqual({ anchor: targetText, href: url })
  } else {
    expect({ anchor: targetText, href: anchor.getAttribute('href') }).toEqual({ anchor: targetText, href: expect.any(String) })
  }
}

//  Verifies that the page contains expected related content links
function fullRelatedContentChecker (root, cyltfrLink) {
  const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
  expect(relatedContentLinks).toHaveLength(6)
  linkChecker(relatedContentLinks, 'Get flood warnings by phone, text or email', 'https://www.gov.uk/get-flood-warnings')
  linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
  linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
  linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
  linkChecker(relatedContentLinks, 'Check your long term flood risk', cyltfrLink)
  linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
}

module.exports = {
  fullRelatedContentChecker
}
