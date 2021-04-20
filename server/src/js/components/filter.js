import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

// Filter list
window.flood.Filter = (id, list) => {
  const state = {
    isModalOpen: false
  }

  const container = document.getElementById(id).querySelector('.defra-facets__container')
  const resultsContainer = document.getElementsByClassName(list)[0]
  const showFilters = document.createElement('button')
  showFilters.className = 'defra-facets__show-filters'
  showFilters.innerHTML = 'Filters'
  const filtersCount = document.createElement('span')
  filtersCount.innerHTML = ' (1)'
  showFilters.appendChild(filtersCount)
  const header = container.querySelector('.defra-facets__header')
  const closeFilters = document.createElement('button')
  closeFilters.className = 'defra-facets__close'
  closeFilters.innerHTML = 'Return to results'
  header.appendChild(closeFilters)
  header.classList.remove('govuk-visually-hidden')
  const content = document.getElementById(id).querySelector('.defra-facets__content')
  const resetFilters = document.createElement('button')
  resetFilters.className = 'defra-facets__reset'
  resetFilters.innerHTML = 'Clear all filters'
  content.appendChild(resetFilters)
  const filterResults = container.querySelector('.defra-facets__filter-results')
  container.appendChild(showFilters)
  container.parentNode.insertBefore(showFilters, container.parentNode.firstChild)

  const selectCounter = container.querySelector('.defra-facets-details__select-counter')
  selectCounter.classList.remove('govuk-visually-hidden')
  const levelCounter = document.querySelector('.defra-search-summary__count')
  const filterInput = container.querySelector('.defra-facets-filter__input')
  const riversList = container.querySelector('.defra-facets-river__list')
  const typesList = container.querySelector('.defra-facets-types__list')
  const riverHeaders = resultsContainer.getElementsByClassName('defra-flood-list__group')

  // Recursively find siblings and parents and add or remove aria-hidden
  // Could become a helper flood utility for working with modals
  const toggleAriaHidden = (target, isHidden) => {
    while (target.parentNode && target.parentNode.nodeType === 1) {
      if (target.parentNode.nodeName !== 'HTML') {
        let sibling = target.parentNode.firstElementChild
        while (sibling && sibling.nodeType === 1) {
          if (sibling !== target && sibling.tagName !== 'SCRIPT' && sibling.tagName !== 'STYLE') {
            isHidden ? sibling.setAttribute('aria-hidden', true) : sibling.removeAttribute('aria-hidden')
          }
          sibling = sibling.nextElementSibling
        }
      }
      target = target.parentNode
    }
  }

  // Constrain focus to tab ring
  const keydown = (e) => {
    if (e.key !== 'Tab') { return }
    if (e.shiftKey) {
      if (document.activeElement === closeFilters) {
        filterResults.focus()
        e.preventDefault()
      }
    } else {
      if (document.activeElement === filterResults) {
        closeFilters.focus()
        e.preventDefault()
      }
    }
  }

  // Escape key behavior
  const keyup = (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeModal()
    }
  }

  // Tabbing into web area
  const focus = (e) => {
    if (!container.contains(document.activeElement)) {
      console.log('Out of modal')
      closeFilters.focus()
    }
  }

  // Open as a modal on mobile devices only
  const openModal = () => {
    container.setAttribute('aria-modal', 'true')
    container.setAttribute('role', 'dialog')
    document.body.style.top = `-${window.scrollY}px`
    document.body.classList.add('defra-facets-body')
    state.isModalOpen = true
    toggleAriaHidden(container, true)
    closeFilters.focus()
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('focus', focus)
    disableBodyScroll(document.querySelector('.defra-facets__container, .defra-facets-details ul'))
  }

  // Close modal on mobile devices only
  const closeModal = () => {
    container.removeAttribute('aria-modal')
    container.removeAttribute('role')
    document.body.classList.remove('defra-facets-body')
    window.scrollTo(0, parseInt(document.body.style.top || '0') * -1)
    document.body.style.top = ''
    state.isModalOpen = false
    toggleAriaHidden(container, false)
    showFilters.focus()
    window.removeEventListener('keydown', keydown)
    window.removeEventListener('keyup', keyup)
    window.removeEventListener('focus', focus)
    clearAllBodyScrollLocks()
  }

  const refreshHeaders = () => {
    let count = 0
    let riverCount = 0
    Array.prototype.forEach.call(riverHeaders, (header) => {
      const items = header.getElementsByClassName('defra-flood-list__item')
      let visible = 0
      Array.prototype.forEach.call(items, (item) => {
        if (item.style.display !== 'none') {
          visible++
        }
      })
      // if no visible stations hide the header and deselect the river name input
      if (!visible) {
        header.style.display = 'none'
        container.querySelector('[data-id="' + header.id + '"').getElementsByTagName('input')[0].checked = false
      } else {
        header.style.display = ''
        container.querySelector('[data-id="' + header.id + '"').getElementsByTagName('input')[0].checked = true
        riverCount++
      }
      count = count + visible
    })
    refreshLevelCount(count)
    refreshRiverCount(riverCount)
  }

  const refreshRiverCount = (count) => {
    if (!count) {
      const inputs = riversList.getElementsByClassName('govuk-checkboxes__input')
      count = 0
      Array.prototype.forEach.call(inputs, (input) => {
        if (input.checked && input.parentElement.style.display === '') {
          count++
        }
      })
    }
    selectCounter.innerHTML = count + ' selected'
  }

  const refreshLevelCount = (count) => {
    if (!count) {
      count = 0
      Array.prototype.forEach.call(riverHeaders, (header) => {
        if (header.style.display !== 'none') {
          const items = header.getElementsByClassName('defra-flood-list__item')
          Array.prototype.forEach.call(items, (item) => {
            if (item.style.display !== 'none') {
              count++
            }
          })
        }
      })
    }
    levelCounter.innerHTML = count + ' level' + ((count > 1 || count === 0) ? 's' : '')
  }

  //
  // Events
  //

  // Detect mobile/non-mobile
  const mobileMediaQuery = window.matchMedia('(max-width: 640px)')
  const mobileListener = (mobileMediaQuery) => {
    const isMobile = mobileMediaQuery.matches
    if (!isMobile && state.isModalOpen) { closeModal() }
  }
  mobileMediaQuery.addListener(mobileListener)
  mobileListener(mobileMediaQuery)

  // Show filters (mobile only)
  showFilters.addEventListener('click', (e) => {
    e.preventDefault()
    openModal()
  })

  // Close filters (mobile only)
  resetFilters.addEventListener('click', (e) => {
    e.preventDefault()
  })

  // Close filters (mobile only)
  closeFilters.addEventListener('click', (e) => {
    e.preventDefault()
    closeModal()
  })

  // Filter results (asynchronous)
  filterResults.addEventListener('click', (e) => {
    e.preventDefault()
    closeModal()
  })

  // filter rivers
  riversList.addEventListener('click', (e) => {
    if (e.target.classList.contains('govuk-checkboxes__input')) {
      resultsContainer.querySelector('[id="' + e.target.value + '"]').style.display = e.target.checked ? '' : 'none'
    }
    refreshRiverCount()
    refreshLevelCount()
  })

  // filter types
  typesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('govuk-checkboxes__input')) {
      // Show or hide those station types
      if (e.target.value) {
        const types = e.target.value.split(',')
        types.forEach(type => {
          for (const element of resultsContainer.getElementsByClassName('defra-flood-type__' + type)) {
            element.style.display = e.target.checked ? '' : 'none'
          }
        })
      }
    }
    refreshHeaders()
  })

  filterInput.addEventListener('keyup', (e) => {
    Array.prototype.forEach.call(riversList.getElementsByClassName('govuk-checkboxes__item'), (river) => {
      if (river.getAttribute('data-river').toUpperCase().indexOf(e.target.value.toUpperCase()) > -1) {
        river.style.display = ''
        resultsContainer.querySelector('[id="' + river.getAttribute('data-id') + '"]').style.display = ''
        // resultsList.getElementById(river.getAttribute('data-id')).style.display = ''
      } else {
        river.style.display = 'none'
        // resultsList.getElementById(river.getAttribute('data-id')).style.display = 'none'
        resultsContainer.querySelector('[id="' + river.getAttribute('data-id') + '"]').style.display = 'none'
      }
    })
    refreshLevelCount()
    refreshRiverCount()
  })

  //
  // startup
  //

  refreshRiverCount()
}
