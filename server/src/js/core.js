'use strict'
// "flood" represents the global namespace for
// client-side javascript across all our pages
window.flood = {
  utils: {
    xhr: (url, callback) => {
      const xmlhttp = new window.XMLHttpRequest()
      xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          try {
            const json = JSON.parse(xmlhttp.responseText)
            callback(null, json)
          } catch (err) {
            callback(err)
          }
        }
      }
      xmlhttp.open('GET', url, true)
      xmlhttp.send()
    },
    forEach: (items, callback) => {
      for (let i = 0; i < items.length; i++) {
        callback.call(items, items[i], i)
      }
    },
    addOrUpdateParameter: (uri, key, value) => {
      // Temporariliy remove fragment
      const i = uri.indexOf('#')
      const hash = i === -1 ? '' : uri.substr(i)
      uri = i === -1 ? uri : uri.substr(0, i)
      const re = new RegExp('([?&])' + key + '=[^&#]*', 'i')
      // Delete parameter and value
      if (value === '') {
        uri = uri.replace(re, '')
      } else if (re.test(uri)) {
        // Replace parameter value
        uri = uri.replace(re, '$1' + key + '=' + value)
        // Add parameter and value
      } else {
        const separator = /\?/.test(uri) ? '&' : '?'
        uri = uri + separator + key + '=' + value
      }
      return uri + hash
    },
    getParameterByName: (name) => {
      const v = window.location.search.match(new RegExp('(?:[?&]' + name + '=)([^&]+)'))
      return v ? v[1] : null
    },
    getCookie: (name) => {
      const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)')
      return v ? v[2] : null
    },
    setCookie: (name, value, days) => {
      const d = new Date()
      d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * days)
      document.cookie = name + '=' + value + ';path=/;expires=' + d.toGMTString() + ';domain=' + document.domain
    },
    setGTagAnalyticsCookies: () => {
      import(/* webpackIgnore: true */ `https://www.googletagmanager.com/gtag/js?id=${process.env.GA_ID}`).then(() => {
        window.dataLayer = window.dataLayer || []
        function gtag () { window.dataLayer.push(arguments) }
        gtag('js', new Date())
        gtag('config', process.env.GA_ID, { cookie_domain: document.domain })
      }
      )
    }
  }
}

const elem = document.getElementById('cookie-banner')

// Check not on cookie settings page
if (elem) {
  const seenCookieMessage = /(^|;)\s*seen_cookie_message=/.test(document.cookie)
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
  acceptButton.className = 'defra-cookie-banner__button-accept'
  acceptButton.innerText = 'Accept analytics cookies'
  cookieButtons.insertBefore(acceptButton, cookieButtons.childNodes[0])

  // First button in banner
  acceptButton.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.utils.setCookie('set_cookie_usage', 'true', 30)
    window.flood.utils.setCookie('seen_cookie_message', 'true', 30)
    window.flood.utils.setGTagAnalyticsCookies()

    document.getElementById('cookie-message').style.display = 'none'
    document.getElementById('cookie-confirmation-type').innerText = 'accepted'
    document.getElementById('cookie-confirmation').removeAttribute('style')
  })

  // Second button in banner
  settingsButton.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.utils.setCookie('seen_cookie_message', 'true', 30)
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
    const useCookies = document.querySelectorAll('input[name="sign-in"]')
    window.flood.utils.setCookie('seen_cookie_message', 'true', 30)
    if (useCookies[0].checked) {
      window.flood.utils.setCookie('set_cookie_usage', 'true', 30)
      window.flood.utils.setGTagAnalyticsCookies()
    } else {
      window.flood.utils.setCookie('set_cookie_usage', '', -1)
      window.flood.utils.setCookie('_ga', '', -1)
      // Get cookie name
      const gtagCookie = document.cookie.match('(^|;) ?(_gat_gtag.*)=([^;]*)(;|$)')
      if (gtagCookie && gtagCookie[2]) {
        window.flood.utils.setCookie(gtagCookie[2], '', -1)
      }
      window.flood.utils.setCookie('_gid', '', -1)
    }
    const alert = document.getElementById('cookie-notification')
    alert.removeAttribute('style')
    alert.focus()
  })
}
