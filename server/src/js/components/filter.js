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
  const header = container.querySelector('.defra-facets__header')
  const closeFilters = document.createElement('button')
  closeFilters.className = 'defra-facets__close'
  closeFilters.innerHTML = 'Return to results'
  header.appendChild(closeFilters)
  header.classList.remove('govuk-visually-hidden')
  const content = document.getElementById(id).querySelector('.defra-facets__content')
  const resetDiv = document.createElement('div')
  resetDiv.style.marginTop = '15px'
  const resetFilters = document.createElement('a')
  resetFilters.className = 'defra-facets__reset'
  resetFilters.setAttribute('role', 'button')
  resetFilters.innerHTML = 'Clear all filters'
  resetFilters.id = 'resetFilters'
  resetDiv.appendChild(resetFilters)
  content.appendChild(resetDiv)
  const filterResults = container.querySelector('.defra-facets__filter-results')
  container.appendChild(showFilters)
  container.parentNode.insertBefore(showFilters, container.parentNode.firstChild)

  const selectCounter = container.querySelector('.defra-facets-details__select-counter')
  selectCounter.classList.remove('govuk-visually-hidden')
  const levelCounter = document.querySelector('.defra-search-summary__count')
  const filterInput = container.querySelector('.defra-facets-filter__input')
  filterInput.classList.remove('govuk-visually-hidden')
  const riversList = container.querySelector('.defra-facets-river__list')
  const typesList = container.querySelector('.defra-facets-types__list')
  const riverHeaders = resultsContainer.getElementsByClassName('defra-flood-list__group')

  const filterForm = document.getElementsByTagName('form')[1]

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
  }

  // refresh total river count in filter column
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

  // Refresh total station/levels count
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
    if (mobileMediaQuery.matches) {
      openModal()
    }
  })

  // Close filters
  resetFilters.addEventListener('click', (e) => {
    e.preventDefault()
    // clear river filter
    filterInput.value = ''
    // tick all river checkboxes
    // tick all types
    Array.prototype.forEach.call(container.getElementsByTagName('input'), input => {
      if (input.type === 'checkbox') {
        input.checked = true
      }
    })
    filterRivers()
    filter()
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

  // filter rivers by input checkbox
  riversList.addEventListener('click', (e) => {
    refreshRiverCount()
    filter()
  })

  // filter types by input checkbox
  typesList.addEventListener('click', (e) => {
    filter()
  })

  // filter rivers by river query box
  filterInput.addEventListener('keyup', (e) => {
    e.preventDefault()
    if (e.key !== 'Enter') {
      filterRivers()
      filter()
    }
  })

  // disable onsubmit for filter form
  filterForm.addEventListener('submit', (e) => {
    e.preventDefault()
    return false
  })

  // move this function further up when finished
  const filter = () => {
    // Steps to complete filter of stations
    let types = []
    let rivers = []
    const riverStr = filterInput.value

    // Get the selected river-ids
    Array.prototype.forEach.call(typesList.getElementsByTagName('input'), input => {
      if (input.checked) {
        types.push(input.value.split(','))
      }
    })

    // flatten out because of 'S,M' for river station types
    // replaced .flat with this .reduce for ie11 compatability
    types = types.reduce((acc, val) => acc.concat(val), [])

    // get the selected rivers
    const riverInputs = container.getElementsByClassName('defra-facets-river__list')[0].getElementsByTagName('input')
    Array.prototype.forEach.call(riverInputs, river => {
      if (river.checked) {
        rivers.push({
          id: river.parentElement.getAttribute('data-id'),
          name: river.parentElement.getAttribute('data-river')
        })
      }
    })

    // if we also have a river search
    if (riverStr) {
      rivers = rivers.filter(river => {
        return river.name.toUpperCase().indexOf(riverStr.toUpperCase()) > -1
      })
    }

    const riverIds = rivers.map(river => {
      return river.id
    })

    // Now loop through results list and filter with values
    Array.prototype.forEach.call(riverHeaders, (river) => {
      let visibleChildren = 0
      if (riverIds.includes(river.getAttribute('data-id'))) {
        river.style.display = ''
        Array.prototype.forEach.call(river.getElementsByClassName('defra-flood-list__item'), item => {
          if (types.includes(item.getAttribute('data-type'))) {
            visibleChildren++
            item.style.display = ''
          } else {
            item.style.display = 'none'
          }
        })
      } else {
        river.style.display = 'none'
      }
      if (visibleChildren === 0) {
        river.style.display = 'none'
      }
    })

    // Update levels count
    refreshLevelCount()
    refreshRiverCount()
  }

  const filterRivers = () => {
    Array.prototype.forEach.call(riversList.getElementsByClassName('govuk-checkboxes__item'), (river) => {
      const display = (river.getAttribute('data-river').toUpperCase().indexOf(filterInput.value.toUpperCase()) > -1) ? '' : 'none'
      // Show/hide the river checkbox
      river.style.display = display
    })
  }

  //
  // startup
  //

  refreshRiverCount()
}
