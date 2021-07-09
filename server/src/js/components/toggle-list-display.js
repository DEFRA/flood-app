'use strict'
// Toggle list display component

const { forEach } = window.flood.utils

const ToggleListDisplay = (container, options) => {
  let isExpanded = false
  const list = document.querySelector('.defra-flood-impact-list')
  const items = list.querySelectorAll(`[data-toggle-list-display-item="${options.type}"]`)
  const button = document.createElement('button')
  button.className = 'defra-button-text govuk-!-margin-bottom-2'
  button.setAttribute('aria-controls', list.id)
  container.appendChild(button)

  const toggleDisplay = () => {
    // Toggle list
    forEach(items, (item) => {
      item.style.display = isExpanded ? 'block' : 'none'
    })
  }

  //
  // Initialise
  //

  toggleDisplay()

  //
  // Events
  //

  button.addEventListener('click', (e) => {
    isExpanded = !isExpanded
    toggleDisplay()
  })
}

window.flood.createToggleListDisplay = (container, options) => {
  return ToggleListDisplay(container, options)
}
