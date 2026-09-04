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

    // Add tooltips
    window.flood.createTooltips()

    // Strip cookie_choice_made from URL so the confirmation doesn't re-appear on refresh
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('cookie_choice_made')) {
      urlParams.delete('cookie_choice_made')
      const newSearch = urlParams.toString()
      window.history.replaceState(null, '', window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash)
    }

    // POST-redirect confirmation banner: intercept "Hide cookie message" link to hide without navigating
    const cookieBanner = document.getElementById('cookie-banner')
    if (cookieBanner) {
      cookieBanner.querySelectorAll('.govuk-cookie-banner__message[role="alert"]:not([hidden]) .govuk-button-group a').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault()
          cookieBanner.style.display = 'none'
        })
      })
    }

    const deleteCookie = (name) => {
      const expires = 'Thu, 01 Jan 1970 00:00:00 UTC'
      document.cookie = `${name}=; expires=${expires}; path=/` // Clear host-only cookie

      // Google Analytics' cookie_domain "auto" setting can store cookies on a parent
      // domain rather than the exact hostname, so clear every possible parent domain too
      const parts = window.location.hostname.split('.')
      for (let i = 1; i < parts.length - 1; i++) {
        document.cookie = `${name}=; expires=${expires}; path=/; domain=.${parts.slice(i).join('.')}`
      }
    }

    const deleteAnalyticsCookies = () => {
      const cookies = document.cookie.split(';')
      cookies.forEach(cookieString => {
        const cookie = cookieString.trim()
        const name = cookie.split('=')[0]
        if (/^_ga($|_.*)|^_gid$|^_gat($|_.*)/.test(name)) {
          deleteCookie(name)
        }
      })
    }

    const isGtmLoaded = () => {
      return !!document.querySelector('script[src*="googletagmanager.com/gtm.js"]')
    }

    const loadAnalyticsClientSide = () => {
      const gtmAccId = window.flood && window.flood.gtmAccId
      if (!gtmAccId || isGtmLoaded()) {
        return
      }

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
      })

      const firstScript = document.getElementsByTagName('script')[0]
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmAccId}`
      firstScript.parentNode.insertBefore(script, firstScript)
    }

    const showBannerConfirmation = (choice, banner) => {
      if (!banner) {
        return
      }

      // Messages: 0 = initial prompt, 1 = accept confirmation, 2 = reject confirmation
      const messages = banner.querySelectorAll('.govuk-cookie-banner__message')
      if (messages.length < 3) {
        return
      }

      messages[0].setAttribute('hidden', '')

      const confirmation = choice === 'accept' ? messages[1] : messages[2]
      confirmation.removeAttribute('hidden')

      const hideButton = confirmation.querySelector('.govuk-button')
      if (hideButton) {
        hideButton.addEventListener('click', (event) => {
          event.preventDefault()
          banner.style.display = 'none'
        })
      }
    }

    const showCookieSettingsConfirmation = () => {
      const alert = document.getElementById('cookie-notification')
      if (alert) {
        alert.removeAttribute('hidden')
        alert.focus()
      }
    }

    const cookiePreferenceForms = document.querySelectorAll('form[action="/cookie-preferences"]')
    cookiePreferenceForms.forEach(form => {
      form.addEventListener('submit', async (event) => {
        event.preventDefault()

        try {
          const submitter = event.submitter
          const formData = new FormData(form)

          if (submitter && submitter.name && submitter.value && !formData.get(submitter.name)) {
            formData.set(submitter.name, submitter.value)
          }

          const selected = formData.get('analytics-consent')

          if (selected !== 'accept' && selected !== 'reject') {
            if (form.requestSubmit && submitter) {
              form.requestSubmit(submitter)
            } else {
              form.submit()
            }
            return
          }

          const response = await window.fetch(form.getAttribute('action'), {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: new URLSearchParams(formData).toString(),
            credentials: 'same-origin'
          })

          if (!response.ok) {
            if (form.requestSubmit && submitter) {
              form.requestSubmit(submitter)
            } else {
              form.submit()
            }
            return
          }

          const result = await response.json()

          if (result.choice === 'accept') {
            loadAnalyticsClientSide()
          }

          if (result.choice === 'reject') {
            deleteAnalyticsCookies()
          }

          const banner = form.querySelector('.govuk-cookie-banner')
          if (banner) {
            showBannerConfirmation(result.choice, banner)
          }

          if (window.location.pathname === '/cookies') {
            showCookieSettingsConfirmation()
          }
        } catch (error) {
          const submitter = event.submitter
          if (form.requestSubmit && submitter) {
            form.requestSubmit(submitter)
          } else {
            form.submit()
          }
        }
      })
    })
  }
})
