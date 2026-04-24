'use strict'
import 'elm-pep'
import { createAll, SkipLink, Button, Tabs } from 'govuk-frontend'
import './utils'
import '../../dist/js/templates'
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
import './components/tooltip'

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'interactive') {
    createAll(SkipLink)
    createAll(Button)
    createAll(Tabs)

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
        btnClass: 'defra-button-secondary',
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

    const elem = document.getElementById('cookie-banner')
    let calledGTag = false

    // Add tooltips
    window.flood.createTooltips()

    // Check not on cookie settings page
    if (elem) {
      const seenCookieMessage = window.flood.utils.hasSeenCookieMessage()
      // Remove banner if seen and avoid flicker
      if (seenCookieMessage) {
        elem.parentNode.removeChild(elem)
      } else {
        elem.style.display = 'block'
      }
    }

    const cookieButtons = document.getElementById('cookie-buttons')
    // JS/Non-JS content - We may already havea helper on live for this
    const nonJsElements = document.getElementsByClassName('defra-no-js')
    Array.prototype.forEach.call(nonJsElements, function (element) {
      element.style.display = 'none'
    })
    const jsElements = document.getElementsByClassName('defra-js')
    Array.prototype.forEach.call(jsElements, function (element) {
      element.removeAttribute('style')
    })

    if (cookieButtons) {
      const settingsButton = document.getElementById('cookie-settings')
      const acceptButton = document.createElement('button')
      const rejectButton = document.createElement('button')

      // Accept button
      acceptButton.className = 'defra-cookie-banner__button-accept'
      acceptButton.innerText = 'Accept analytics cookies'
      cookieButtons.insertBefore(acceptButton, cookieButtons.childNodes[0])

      // First button in banner (Accept)
      acceptButton.addEventListener('click', function (e) {
        e.preventDefault()
        window.flood.utils.setAnalyticsConsent(true)
        calledGTag = true
        document.getElementById('cookie-message').style.display = 'none'
        document.getElementById('cookie-confirmation-type').innerText = 'accepted'
        document.getElementById('cookie-confirmation').style.display = ''
      })

      // Reject Button
      rejectButton.className = 'defra-cookie-banner__button-reject'
      rejectButton.innerText = 'Reject analytics cookies'
      cookieButtons.insertBefore(rejectButton, cookieButtons.childNodes[1])

      // Second button in banner (Reject)
      rejectButton.addEventListener('click', function (e) {
        e.preventDefault()
        window.flood.utils.setAnalyticsConsent(false)

        document.getElementById('cookie-message').style.display = 'none'
        document.getElementById('cookie-confirmation-type').innerText = 'rejected'
        document.getElementById('cookie-confirmation').style.display = ''
      })

      // Third button in banner (Settings)
      settingsButton.addEventListener('click', function (e) {
        e.preventDefault()
        window.location.href = settingsButton.getAttribute('href')
      })

      const hideButton = document.getElementById('cookie-hide')

      hideButton.addEventListener('click', function (e) {
        e.preventDefault()
        document.getElementById('cookie-banner').style.display = 'none'
      })
    }

    const saveButton = document.getElementById('cookies-save')

    if (saveButton) {
      saveButton.addEventListener('click', function (e) {
        e.preventDefault()

        try {
          const useCookies = document.querySelectorAll('input[name="accept-analytics"]')

          if (useCookies[0].checked) {
            window.flood.utils.setAnalyticsConsent(true)
            calledGTag = true
          } else {
            window.flood.utils.setAnalyticsConsent(false)
          }

          const alert = document.getElementById('cookie-notification')
          alert.removeAttribute('style')
          alert.focus()
        } catch (error) {
          console.error(`An error occurred when handling the save button click event: ${error}`)
        }
      })
    }

    if (!calledGTag) {
      // finally make Gtag page view if not before and cookie allows
      if (window.flood.utils.hasAnalyticsConsent()) {
        calledGTag = true
        window.flood.utils.setGTagAnalyticsCookies()
      }
    }
  }
})
