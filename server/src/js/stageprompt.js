
// (function (global) {
//   'use strict'
//   const $ = global.jQuery
//   const GOVUK = global.GOVUK || {}
  
//   GOVUK.performance = GOVUK.performance || {}  
  
//   GOVUK.performance.stageprompt = (function () {
    
    
//     const splitAction = (action) => {
//       console.log('action :', action)
//       const parts = action.split(':')
//       console.log('parts : ', parts)
//       if (parts.length <= 3) {
//         console.log('parts : ', parts)
//         return parts
//       }
//       return [parts.shift(), parts.shift(), parts.join(':')]
//     }
    
//     const setup = (analyticsCallback) => {
//       console.log('AC : ', analyticsCallback)
//       const journeyStage = window.$('[data-journey]').attr('data-journey', 1)
//       const journeyHelpers = window.$('[data-journey-click]', 1)
//       console.log('journeyStage :', journeyStage)
//       console.log('journeyHelpers :', journeyHelpers)
      
//       if (journeyStage) {
//         // console.log('journeyStage ')
//         analyticsCallback.apply(null, splitAction(journeyStage))
//       }

//       journeyHelpers.on('click', function (event) {
//         analyticsCallback.apply(null, splitAction($(this).data('journey-click')))
//       })
//     }

//     const setupForGoogleAnalytics = function () {
//       console.log('Window: ', window)
//       setup(GOVUK.performance.sendGoogleAnalyticsEvent)
//     }

//     return {
//       setup,
//       setupForGoogleAnalytics
//     }
//   }())
  
//   GOVUK.performance.sendGoogleAnalyticsEvent = function (category, event, label) {
//     if (window.ga && typeof window.ga === 'function') {
//       window.ga('send', 'event', category, event, label, {
//         nonInteraction: true
//       })
//     } else {
//       global._gaq.push(['_trackEvent', category, event, label, undefined, true])
//     }
//   }

//   global.GOVUK = GOVUK
// })(window)

// Stageprompt 2.0.1
//
// See: https://github.com/alphagov/stageprompt
//
// Stageprompt allows user journeys to be described and instrumented
// using data attributes.
//
// Setup (run this on document ready):
//
//   GOVUK.performance.stageprompt.setupForGoogleAnalytics();
//
// Usage:
//
//   Sending events on page load:
//
//     <div id="wrapper" class="service" data-journey="pay-register-birth-abroad:start">
//         [...]
//     </div>
//
//   Sending events on click:
//
//     <a class="help-button" href="#" data-journey-click="stage:help:info">See more info...</a>

;(function (global) {
  'use strict'

  var $ = global.jQuery
  var GOVUK = global.GOVUK || {}

  GOVUK.performance = GOVUK.performance || {}

  GOVUK.performance.stageprompt = (function () {
    var setup, setupForGoogleAnalytics, splitAction

    splitAction = function (action) {
      var parts = action.split(':')
      if (parts.length <= 3) return parts
      return [parts.shift(), parts.shift(), parts.join(':')]
    }

    setup = function (analyticsCallback) {
      var journeyStage = $('[data-journey]').attr('data-journey')
      var journeyHelpers = $('[data-journey-click]')
      
      if (journeyStage) {
        analyticsCallback.apply(null, splitAction(journeyStage))
      }

      journeyHelpers.on('click', function (event) {
        analyticsCallback.apply(null, splitAction($(this).data('journey-click')))
      })
    }

    setupForGoogleAnalytics = function () {
      setup(GOVUK.performance.sendGoogleAnalyticsEvent)
    }

    return {
      setup: setup,
      setupForGoogleAnalytics: setupForGoogleAnalytics
    }
  }())

  GOVUK.performance.sendGoogleAnalyticsEvent = function (category, event, label) {
    if (window.gtag && typeof window.gtag === 'function') {
      window.gtag('event', event, {'event_category':category ,'event_label':label, value: 1})
    } else {
      global.window._gaq.push(['_trackEvent', category, event, label, undefined, true])
    }
  }

  global.GOVUK = GOVUK
})(window)
