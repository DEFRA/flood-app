'use strict'

// Toggletip component

const { forEach } = window.flood.utils

const toggletips = () => {
  // Add tooltip
  const openToggletip = (button) => {
    // Update reference
    currentButton = button
    // Outer margin
    const viewportMargin = 15
    // Determin position of overlay
    const info = button.nextElementSibling
    const text = info.querySelector('span:first-child')
    const arrow = info.querySelector('.defra-toggletip__arrow')
    text.innerHTML = ''
    // Timeout recommend to ensure aria-live region is re-read
    window.setTimeout(() => {
      text.innerHTML = button.parentNode.getAttribute('data-toggletip-content')
      button.parentNode.classList.add('defra-toggletip--open')
      const buttonLeft = button.getBoundingClientRect().left
      const buttonWidth = button.getBoundingClientRect().width
      const viewportWidth = window.innerWidth
      let infoWidth = info.getBoundingClientRect().width
      infoWidth = infoWidth > (viewportWidth - (viewportMargin * 2)) ? viewportWidth - (viewportMargin * 2) : infoWidth

      // Centre tip
      let infoOffsetX = ((infoWidth - buttonWidth) / 2) - (((infoWidth - buttonWidth) / 2) * 2)
      // Correct offset if near sides
      if ((buttonLeft + infoOffsetX) < viewportMargin) {
        // Left side
        infoOffsetX = viewportMargin - buttonLeft
      } else if ((buttonLeft + infoWidth + infoOffsetX) > (viewportWidth - viewportMargin)) {
        // Right side
        infoOffsetX = (viewportWidth - viewportMargin - buttonLeft) - infoWidth
      }
      arrow.style.left = `${Math.abs(infoOffsetX) + Math.round((buttonWidth / 2))}px`
      info.style.marginLeft = `${infoOffsetX}px`
      // Overide width so it doesn't truncate at zoom levels
      info.style.width = `${infoWidth}px`
      // Switch position if near top
      if (info.getBoundingClientRect().top < viewportMargin) {
        button.parentNode.classList.add('defra-toggletip--bottom')
      }
    }, 100)
  }

  // Remove tooltip
  const closeToggletips = () => {
    // Update reference
    currentButton = null
    const toggletips = document.querySelectorAll('.defra-toggletip--open')
    if (toggletips.length) {
      toggletips.forEach(toggletip => {
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
  let currentButton

  // Create toggletips
  const toggletips = document.querySelectorAll('.defra-toggletip')
  forEach(toggletips, (toggletip) => {
    const button = document.createElement('button')
    button.className = 'defra-toggletip__button'
    button.setAttribute('aria-label', toggletip.getAttribute('data-label'))
    button.innerHTML = '<span>i</span>'
    const info = document.createElement('span')
    info.className = 'defra-toggletip__info'
    info.setAttribute('role', 'status')
    info.innerHTML = '<span></span><span class="defra-toggletip__arrow"></span>'
    toggletip.appendChild(button)
    toggletip.appendChild(info)
  })

  // Add on click
  document.addEventListener('click', (e) => {
    const isButton = e.target.classList && e.target.classList.contains('defra-toggletip__button')
    isButton ? openToggletip(e.target) : closeToggletips()
  })

  // Remove on escape
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeToggletips()
    }
  })

  // Add on mouse enter
  document.addEventListener('mouseenter', (e) => {
    if (e.target.classList && e.target.classList.contains('defra-toggletip__button')) {
      closeToggletips()
      openToggletip(e.target)
    }
  }, true)

  // Remove on mouse leave
  document.addEventListener('mouseleave', (e) => {
    if (e.target.classList && e.target.classList.contains('defra-toggletip__button')) {
      closeToggletips()
    }
  }, true)

  // Add on focus
  // document.addEventListener('focusin', (e) => {
  //   if (e.target.classList && e.target.classList.contains('defra-toggletip__button')) {
  //     closeToggletips()
  //     openToggletip(e.target)
  //   }
  // })

  // Remove on blur
  document.addEventListener('focusout', (e) => {
    if (e.target.classList && e.target.classList.contains('defra-toggletip__button')) {
      closeToggletips()
    }
  })

  // Page zoom
  window.addEventListener('resize', (e) => {
    if (currentButton) {
      openToggletip(currentButton)
    }
  })
}

window.flood.createToggletips = () => {
  return toggletips()
}
