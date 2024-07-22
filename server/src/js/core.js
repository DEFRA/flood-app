'use strict'
import 'elm-pep'
import { SkipLink, Button, Tabs } from 'govuk-frontend'
import './utils'
import './components/nunjucks'
import './components/map/maps'
import './components/map/styles'
import './components/map/layers'
import './components/map/container'
import './components/map/live'
import './components/map/outlook'
import './components/levels-table'
import './components/toggle-list-display'
import './components/toggletip'

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {
    // Initialise govuk components
    const skipLink = document.querySelector('[data-module="govuk-skip-link"]')

    if (skipLink) {
      new SkipLink(skipLink).init()
    }

    const button = document.querySelector('[data-module="govuk-button"]')

    if (button) {
      new Button(button).init()
    }

    const tabs = document.querySelector('[data-module="govuk-tabs"]')

    if (tabs) {
      new Tabs(tabs).init()
    }

    const model = window.flood.model

    // Initialise live map
    if (document.getElementById('map-live')) {
      window.flood.maps.createLiveMap('map-live', {
        btnText: model.mapButtonText,
        btnClass: model.mapButtonClass,
        btnType: model.mapButtonType || null,
        layers: model.mapLayers,
        extent: model.extent || null,
        riverId: model.riverId || null,
        centre: model.centre || null,
        zoom: model.zoom || null,
        selectedId: model.selectedId || null,
        targetArea: model.targetArea || null,
        data: model.data || null
      })
    }

    // Initialise outlook map
    if (document.getElementById('map-outlook')) {
      window.flood.maps.createOutlookMap('map-outlook', {
        btnText: 'View map showing flood risk areas',
        btnClass: 'defra-button-secondary defra-button-secondary--icon',
        days: model.outlookDays,
        data: model.outlookData || null
      })
    }

    // Add category tabs progressive enhancement
    if (document.getElementById('filter')) {
      window.flood.createLevelsTable('filter')
    }

    // Initialize toggletips
    if (document.querySelector('[data-toggletip]')) {
      window.flood.createToggletips()
    }

    // Add toggle list display for impacts
    const toggleListDisplay = document.getElementById('toggle-list-display')

    if (toggleListDisplay) {
      window.flood.createToggleListDisplay(toggleListDisplay, {
        type: window.flood.model.toggletip.type,
        btnText: window.flood.model.toggletip.buttonText
      })
    }
  }
})
