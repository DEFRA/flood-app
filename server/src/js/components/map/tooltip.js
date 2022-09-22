'use strict'

// Tooltip component

const { xhr } = window.flood.utils

// ie11 closest() polyfill
const Element = window.Element
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector
}
if (!Element.prototype.closest) {
  Element.prototype.closest = (s) => {
    let el = this
    do {
      if (Element.prototype.matches.call(el, s)) return el
      el = el.parentElement || el.parentNode
    } while (el !== null && el.nodeType === 1)
    return null
  }
}

const Tooltips = (options) => {
  // Setup defaults
  const defaults = {
    margin: 15
  }
  options = Object.assign({}, defaults, options)

  // Add tooltip
  const addTooltip = (tool) => {
    // Outer margin
    const viewportMargin = options.margin
    // Open tooltip first so we can get dimensions
    tool.parentNode.classList.add('defra-tooltip--open')
    // Typically more text so width is fixed
    if (tool.tagName === 'A') {
      tool.parentNode.classList.add('defra-tooltip--fixed-width')
    }
    // Determin position of overlay
    const tooltip = tool.parentNode
    const tooltipLeft = tooltip.getBoundingClientRect().left
    const tooltipWidth = tooltip.getBoundingClientRect().width
    const tip = tool.nextElementSibling
    const tipWidth = tip.getBoundingClientRect().width
    // Centre tip
    let tipOffsetX = ((tipWidth - tooltipWidth) / 2) - (((tipWidth - tooltipWidth) / 2) * 2)
    // Correct offset if near sides of govuk-width-container
    const newTipLeft = tooltipLeft + tipOffsetX
    const viewportWidth = window.innerWidth
    if (newTipLeft < viewportMargin) {
      // Left side
      tipOffsetX = ((tooltipLeft - viewportMargin) / 2) - (((tooltipLeft - viewportMargin) / 2) * 2)
    } else if ((newTipLeft + tipWidth) > (viewportWidth - viewportMargin)) {
      // Right side
      tipOffsetX = tipOffsetX - (newTipLeft + tipWidth - (viewportWidth - viewportMargin))
    }

    // Switch position if near top
    if (tip.getBoundingClientRect().top < viewportMargin) {
      tool.parentNode.classList.add('defra-tooltip--bottom')
    }
    tip.style.marginLeft = `${tipOffsetX}px`
  }

  // Remove tooltip
  const removeTooltips = () => {
    const tooltips = document.querySelectorAll('.defra-tooltip--open')
    if (tooltips.length) {
      tooltips.forEach((tooltip) => {
        tooltip.classList.remove('defra-tooltip--open')
        tooltip.classList.remove('defra-tooltip--bottom')
        tooltip.classList.remove('defra-tooltip--keyboard-focus')
        const tip = tooltip.querySelector('.defra-tooltip__tip')
        tip.style.removeProperty('margin-left')
        // xhr tooltips
        const status = tooltip.querySelector('[role="status"]')
        if (status) { status.innerHTML = '' }
      })
    }
  }

  // Add on click (xhr tooltip only)
  document.addEventListener('click', (e) => {
    const tool = e.target.closest('.defra-tooltip__tool')
    const isXhrTool = tool && tool.tagName === 'A'
    // Remove tooltips when clicking outside unless its a basic tooltip
    if (!tool || isXhrTool) { removeTooltips() }
    if (tool) { e.preventDefault() }
    // Only intersted in xhrTools from here on
    if (!isXhrTool) { return }
    // Get content
    const content = tool.nextElementSibling
    const url = tool.href.split(/\?|#/)[0]
    // XMLHttpRequest
    xhr(url, (err, response) => {
      if (err) {
        console.log('Error: ' + err)
      } else {
        content.innerHTML = ''
        const fragmentId = tool.href.substring(tool.href.indexOf('#'))
        const fragment = response.querySelector(`${fragmentId}`)
        // Remove any hyperlinks
        fragment.querySelectorAll('a').forEach(link => {
          link.outerHTML = link.innerHTML
        })
        content.appendChild(fragment)
        addTooltip(tool)
      }
    }, 'document')
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      removeTooltips()
    }
  })

  // Add on mouse enter (basic tooltip only)
  document.addEventListener('mouseenter', (e) => {
    const isTooltip = e.target.classList && e.target.classList.contains('defra-tooltip')
    if (isTooltip && e.target.firstElementChild.tagName !== 'A') {
      removeTooltips()
      addTooltip(e.target.firstElementChild)
    }
  }, true)

  // Remove on mouse leave (basic tooltip only)
  document.addEventListener('mouseleave', (e) => {
    const isTooltip = e.target.classList && e.target.classList.contains('defra-tooltip')
    if (isTooltip && e.target.firstElementChild.tagName !== 'A') {
      removeTooltips()
    }
  }, true)

  // Add on focus (basic tooltip only)
  document.addEventListener('focusin', (e) => {
    const isTool = e.target.classList.contains('defra-tooltip__tool')
    if (isTool && e.target.tagName !== 'A') {
      removeTooltips()
      addTooltip(e.target)
    }
  })

  // Remove on blur (basic and xhr tooltips)
  document.addEventListener('focusout', (e) => {
    const isTool = e.target.classList.contains('defra-tooltip__tool')
    if (isTool) {
      e.target.parentNode.classList.remove('defra-tooltip--keyboard-focus')
      removeTooltips()
    }
  })
}

window.flood.createTooltips = (options) => {
  return Tooltips(options)
}
