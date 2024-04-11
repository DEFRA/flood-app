const { expect } = require('@hapi/code')

function linkChecker (anchors, targetText, url) {
  const anchor = anchors.find(a => a.text.trim() === targetText)
  expect(anchor, `Anchor ${targetText} not found`).to.exist()
  expect(anchor.getAttribute('href'), `Anchor ${targetText} doesn't contain expected URL (${url})`).to.equal(url)
}

module.exports = {
  linkChecker
}
