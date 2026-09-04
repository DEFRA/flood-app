// Dev mode mock Google Tag Manager - simulates GA4 cookie creation for local testing
(function () {
  'use strict'

  const createGACookies = function () {
    const expires = new Date()
    expires.setDate(expires.getDate() + 400)
    const expiresStr = expires.toUTCString()

    const clientId = Math.floor(Math.random() * 1000000000)
    const timestamp = Math.floor(Date.now() / 1000)

    // _ga: Google Analytics universal cookie (GA version + Client ID + Timestamp)
    document.cookie = `_ga=GA1.1.${clientId}.${timestamp}; expires=${expiresStr}; path=/; SameSite=Strict; Secure`

    // _ga_XXXXXXXXXX: GA4 measurement ID cookie (GA4 marker + Session ID + Timestamp + Event count)
    document.cookie = `_ga_XXXXXXXXXX=GS1.1.${timestamp}.1; expires=${expiresStr}; path=/; SameSite=Strict; Secure`

    // _gid: Google Analytics session cookie (GA version + Client ID + Timestamp)
    document.cookie = `_gid=GA1.1.${Math.floor(Math.random() * 1000000000)}.${timestamp}; expires=session; path=/; SameSite=Strict; Secure`
  }

  // Initialize data layer (GTM pattern)
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  // Create cookies after a small delay to simulate GTM loading
  setTimeout(createGACookies, 100)
})()
