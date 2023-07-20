const { JSDOM } = require('jsdom')

module.exports = {
  setupDOM,
  cleanupDOM
}
function setupDOM () {
  const dom = new JSDOM('<body></body>')
  global.window = dom.window
  global.document = dom.window.document
  dom.window.flood = {}
  polyfillSVG(dom.window)
}

function cleanupDOM () {
  delete global.window
  delete global.document
}

function polyfillSVG (window) {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({
      x: 0,
      y: 0,
      width: 0,
      height: 0
    })
  })
}
