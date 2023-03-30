'use strict'

// Toggletip component

const { forEach } = window.flood.utils

const toggletips = () => {
  // Reference to timeout
  let timeout

  // Add tooltip
  const openToggletip = (toggletip) => {
    // Outer margin
    const viewportMargin = 15
    // Determin position of overlay
    const info = toggletip.querySelector('.defra-toggletip__info')
    const text = info.querySelector('.defra-toggletip__text')
    const arrow = info.querySelector('.defra-toggletip__arrow')
    text.innerHTML = ''
    // Timeout recommended to ensure aria-live region is re-read
    timeout = window.setTimeout(() => {
      // Update reference
      closeToggletips()
      currentToggletip = toggletip
      text.innerHTML = `<span>${toggletip.getAttribute('data-toggletip-content')}</span>`
      toggletip.classList.add('defra-toggletip--open')
      const target = toggletip.querySelector('.defra-toggletip-target') || toggletip
      const targetWidth = target.getBoundingClientRect().width
      const targetLeft = target.getBoundingClientRect().left
      const viewportWidth = window.innerWidth
      let infoWidth = info.getBoundingClientRect().width
      // Limit info width when zoomed
      infoWidth = infoWidth > (viewportWidth - (viewportMargin * 2)) ? viewportWidth - (viewportMargin * 2) : infoWidth
      // Centre tip
      let infoOffsetX = (targetWidth - infoWidth) / 2
      // Correct offset if near sides
      if ((targetLeft + infoOffsetX) < viewportMargin) {
        // Left side
        infoOffsetX = viewportMargin - targetLeft
      } else if ((targetLeft + infoOffsetX + infoWidth) > (viewportWidth - viewportMargin)) {
        // Right side
        infoOffsetX = (viewportWidth - viewportMargin - infoWidth) - targetLeft
      }
      arrow.style.left = `${(0 - infoOffsetX) + (targetWidth / 2)}px`
      info.style.marginLeft = `${infoOffsetX}px`
      // Overide width so it doesn't truncate at zoom levels
      info.style.width = `${infoWidth}px`
      // Switch position if near top
      if (info.getBoundingClientRect().top < viewportMargin) {
        toggletip.classList.add('defra-toggletip--bottom')
      }
    }, 100)
  }

  // Remove tooltip
  const closeToggletips = () => {
    // Update reference
    clearTimeout(timeout)
    currentToggletip = null
    const toggletips = document.querySelectorAll('.defra-toggletip--open')
    if (toggletips.length) {
      forEach(toggletips, toggletip => {
        toggletip.classList.remove('defra-toggletip--open')
        toggletip.classList.remove('defra-toggletip--bottom')
        toggletip.classList.remove('defra-toggletip--keyboard-focus')
        const info = toggletip.querySelector('.defra-toggletip__info')
        info.style.removeProperty('width')
        info.style.removeProperty('margin-left')
        const text = info.querySelector('span:first-child')
        text.innerHTML = ''
        const arrow = info.querySelector('.defra-toggletip__arrow')
        arrow.style.removeProperty('left')
      })
    }
  }

  // Reference to current button
  let currentToggletip

  // Create toggletips
  const toggletips = document.querySelectorAll('[data-toggletip]')
  forEach(toggletips, (toggletip) => {
    const info = document.createElement('span')
    info.className = 'defra-toggletip__info'
    info.setAttribute('role', 'status')
    info.innerHTML = '<span class="defra-toggletip__text"></span><span class="defra-toggletip__arrow"></span>'
    toggletip.classList.add('defra-toggletip')
    const container = document.createElement('span')
    container.className = 'defra-toggletip__container'
    container.setAttribute('data-toggletip-container', '')
    const button = document.createElement('button')
    button.className = 'defra-toggletip__button defra-toggletip-target'
    button.setAttribute('aria-label', toggletip.getAttribute('data-toggletip-label') || 'More information')
    button.innerHTML = `
      <span class="defra-toggletip__button-icon">
      <svg focusable="false" aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" style="fill-rule:evenodd;clip-rule:evenodd">
      <circle cx="9" cy="9" r="7.5" style="fill:none;stroke:currentColor;stroke-width:1px;"/>
      <text x="4.687px" y="12.906px" fill="currentColor" style="font-family:'Courier-Bold', 'Courier';font-size:14px;">i</text>
      </svg>
      </span>
      <span class="defra-toggletip__button-text">i</span>
      `
    container.appendChild(button)
    container.appendChild(info)
    toggletip.appendChild(container)
  })

  // Add on click
  document.addEventListener('click', (e) => {
    const isTarget = e.target.classList.contains('defra-toggletip-target')
    const isInfo = !!e.target.closest('.defra-toggletip__info')
    if (isTarget) {
      const toggletip = e.target.closest('.defra-toggletip')
      openToggletip(toggletip)
    } else if (!isInfo) {
      closeToggletips()
    }
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeToggletips()
    }
  })

  // Add on mouse enter
  document.addEventListener('mouseenter', (e) => {
    if (e.target === document) return
    const isTarget = !!e.target.closest('.defra-toggletip-target')
    if (isTarget && !currentToggletip) {
      const toggletip = e.target.closest('.defra-toggletip')
      openToggletip(toggletip)
    }
  }, true)

  // Remove on mouse leave
  document.addEventListener('mouseleave', (e) => {
    if (e.target === document) return
    const isTarget = e.target.hasAttribute('data-toggletip-container')
    if (isTarget) {
      closeToggletips()
    }
  }, true)

  // Add on focus
  document.addEventListener('focusin', (e) => {
    const toggletip = e.target.closest('.defra-toggletip')
    if (toggletip) {
      closeToggletips()
      openToggletip(toggletip)
    }
  })

  // Remove on blur
  document.addEventListener('focusout', (e) => {
    const toggletip = e.target.closest('.defra-toggletip')
    if (toggletip) {
      closeToggletips()
    }
  })

  // Page zoom
  // window.addEventListener('resize', (e) => {
  //   if (currentToggletip) {
  //     openToggletip(currentToggletip)
  //   }
  // })
}

window.flood.createToggletips = () => {
  return toggletips()
}
