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

    const cookieBanner = document.querySelector('.govuk-cookie-banner')
    let calledGTag = false

    // Add tooltips
    window.flood.createTooltips()

    // Check not on cookie settings page
    if (cookieBanner) {
      const seenCookieMessage = /(^|;)\s*seen_cookie_message=/.test(document.cookie)
      // Remove banner if seen and avoid flicker
      if (seenCookieMessage) {
        cookieBanner.parentNode.removeChild(cookieBanner)
      } else {
        cookieBanner.removeAttribute('hidden')
      }
    }

    // JS/Non-JS content - We may already have a helper on live for this
    const nonJsElements = document.getElementsByClassName('defra-no-js')
    Array.prototype.forEach.call(nonJsElements, function (element) {
      element.style.display = 'none'
    })
    const jsElements = document.getElementsByClassName('defra-js')
    Array.prototype.forEach.call(jsElements, function (element) {
      element.removeAttribute('style')
    })

    if (cookieBanner) {
      const bannerMessages = cookieBanner.querySelectorAll('.govuk-cookie-banner__message')
      const questionMessage = bannerMessages[0]
      const acceptConfirmMessage = bannerMessages[1]
      const rejectConfirmMessage = bannerMessages[2]

      const acceptButton = cookieBanner.querySelector('button[name="cookies[additional]"][value="yes"]')
      const rejectButton = cookieBanner.querySelector('button[name="cookies[additional]"][value="no"]')
      const hideButtons = cookieBanner.querySelectorAll('button[name="cookies[hide]"]')

      // Accept button
      if (acceptButton) {
        acceptButton.addEventListener('click', function (e) {
          e.preventDefault()
          window.flood.utils.setCookie('set_cookie_usage', 'true', 30)
          window.flood.utils.setCookie('seen_cookie_message', 'true', 30)
          calledGTag = true
          window.flood.utils.setGTagAnalyticsCookies()
          questionMessage.setAttribute('hidden', '')
          if (acceptConfirmMessage) acceptConfirmMessage.removeAttribute('hidden')
        })
      }

      // Reject button
      if (rejectButton) {
        rejectButton.addEventListener('click', function (e) {
          e.preventDefault()
          window.flood.utils.setCookie('seen_cookie_message', 'true', 30)
          // Delete GA cookies immediately on rejection
          deleteGA4Cookies()
          questionMessage.setAttribute('hidden', '')
          if (rejectConfirmMessage) rejectConfirmMessage.removeAttribute('hidden')
        })
      }

      // Hide buttons (in confirmation panels)
      hideButtons.forEach(function (hideButton) {
        hideButton.addEventListener('click', function (e) {
          e.preventDefault()
          cookieBanner.setAttribute('hidden', '')
        })
      })
    }

    const saveButton = document.getElementById('cookies-save')

    function setCookie (name, value, days) {
      try {
        window.flood.utils.setCookie(name, value, days)
      } catch (error) {
        console.error(`Failed to set cookie ${name}: ${error}`)
      }
    }

    function deleteGA4Cookies () {
      try {
        const cookies = document.cookie.split(';')

        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim()

          const name = cookie.split('=')

          // Check if the cookie name starts with "_ga_"
          if (cookie.indexOf('_ga_') === 0) {
            deleteCookie(name[0])
          }
          if (cookie.indexOf('_ga') === 0) {
            deleteCookie(name[0])
          }
        }
      } catch (error) {
        console.error(`Failed to delete GA4 cookies: ${error}`)
      }
    }

    function deleteCookie (name) {
      try {
        const expires = 'Thu, 01 Jan 1970 00:00:00 UTC'
        document.cookie = name + '=; expires=' + expires + '; path=/; domain=' + window.location.hostname
        // clears GA cookies that are set on the .defra.cloud domain by default, may be able to remove line
        // in future once GA4 is fully rolled out to all users
        document.cookie = name + '=; expires=' + expires + '; path=/; domain=.defra.cloud;'
      } catch (error) {
        console.error(`Failed to delete cookie ${name}: ${error}`)
      }
    }

    if (saveButton) {
      saveButton.addEventListener('click', function (e) {
        e.preventDefault()

        try {
          const useCookies = document.querySelectorAll('input[name="accept-analytics"]')
          setCookie('seen_cookie_message', 'true', 30)

          if (useCookies[0].checked) {
            setCookie('set_cookie_usage', 'true', 30)
            calledGTag = true
            deleteCookie('google-analytics-opt-out')
            window.flood.utils.setGTagAnalyticsCookies()
          } else {
            setCookie('set_cookie_usage', '', -1)
            deleteGA4Cookies()
            window.flood.utils.disableGoogleAnalytics()
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
      if (window.flood.utils.getCookie('set_cookie_usage')) {
        calledGTag = true
        window.flood.utils.setGTagAnalyticsCookies()
      }
    }

    // Legacy opt-out cookie cleanup for backwards compatibility.
    // Users who previously rejected analytics under the old system will have
    // a 'google-analytics-opt-out' cookie. This ensures their choice is respected
    // by removing any GA cookies on page load. Can be removed once all users have
    // migrated to the new consent system.
    // if (window.flood.utils.getCookie('google-analytics-opt-out')) {
    //   deleteGA4Cookies()
    // }
  }
})
