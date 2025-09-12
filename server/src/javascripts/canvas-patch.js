/* eslint-env browser */

// Monkey-patch to suppress Canvas2D getImageData warning
const origGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = function (type, attrs) {
  if (type === '2d') {
    return origGetContext.call(this, type, { willReadFrequently: true, ...attrs })
  }
  return origGetContext.call(this, type, attrs)
}

// Suppress the Canvas2D warning in console
const originalWarn = console.warn
console.warn = function (...args) {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('Canvas2D: Multiple readback operations using getImageData are faster with the willReadFrequently attribute set to true')) {
    return // Suppress
  }
  originalWarn.apply(console, args)
}
