'use strict'

import 'core-js/modules/es.promise.js'
import 'core-js/modules/es.array.iterator.js'

// Math.log2 Polyfil
if (!Math.log2) {
  Math.log2 = (x) => {
    console.log('Using Math.log2')
    return Math.log(x) * Math.LOG2E
  }
}

// Element closest Polyfil
if (!window.Element.prototype.matches) {
  window.Element.prototype.matches = window.Element.prototype.msMatchesSelector || window.Element.prototype.webkitMatchesSelector
}
if (!window.Element.prototype.closest) {
  window.Element.prototype.closest = (s) => {
    let el = this
    do {
      if (window.Element.prototype.matches.call(el, s)) return el
      el = el.parentElement || el.parentNode
    } while (el !== null && el.nodeType === 1)
    return null
  }
}

// Simplification algorythom
const douglasPeucker = (points, tolerance) => {
  const last = points.length - 1
  const p1 = points[0]
  const p2 = points[last]
  const x21 = p2.timestamp - p1.timestamp
  const y21 = p2.value - p1.value
  const [dMax, x] = points.slice(1, last)
    .map(p => Math.abs(y21 * p.timestamp - x21 * p.value + p2.timestamp * p1.value - p2.value * p1.timestamp))
    .reduce((p, c, i) => {
      const v = Math.max(p[0], c)
      return [v, v === p[0] ? p[1] : i + 1]
    }, [-1, 0])
  if (dMax > tolerance) {
    return [...douglasPeucker(points.slice(0, x + 1), tolerance), ...douglasPeucker(points.slice(x), tolerance).slice(1)]
  }
  return [points[0], points[last]]
}

// "flood" represents the global namespace for
// client-side javascript across all our pages
if (!window.flood) {
  window.flood = {}
}

window.flood.utils = {
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
    document.cookie = name + '=' + value + ';path=/;expires=' + d.toGMTString() + ';domain=' + window.location.hostname
  },
  setGTagAnalyticsCookies: () => {
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.GA4_ID}`
    script.onload = () => {
      window.dataLayer = window.dataLayer || []
      function gtag () { window.dataLayer.push(arguments) }
      gtag('js', new Date())
      gtag('config', process.env.GA4_ID, { cookie_domain: window.location.hostname })
    }

    const gtagManager = document.createElement('script')
    gtagManager.innerHTML = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${process.env.GTM_ID}');`

    const noscript = document.createElement('noscript')
    const iframe = document.createElement('iframe')
    iframe.setAttribute('src', `https://www.googletagmanager.com/ns.html?id=${process.env.GA4_ID}`)
    iframe.setAttribute('height', '0')
    iframe.setAttribute('width', '0')
    iframe.setAttribute('style', 'display:none;visibility:hidden')
    noscript.appendChild(iframe)

    const head = document.getElementsByTagName('head')[0]
    head.insertBefore(gtagManager, head.firstChild)
    document.head.appendChild(gtagManager)
    document.body.appendChild(noscript)
    document.body.appendChild(script)
  },
  disableGoogleAnalytics: () => {
    const script = document.createElement('script')
    script.text = `
      if (!window.flood.utils.getCookie('set_cookie_usage')) {
        window['ga-disable-${process.env.GA4_ID}'] = true;
      } else {
        window['ga-disable-${process.env.GA4_ID}'] = false;
      }
    `
    document.head.appendChild(script)
  },
  // Takes a valuesobject and concatentates items using commas and 'and'.
  getSummaryList: (values) => {
    const lines = []
    let summary = ''
    values.forEach((v, i) => {
      if (v.count) {
        lines.push(`${v.count} ${v.text}${v.count !== 1 ? 's' : ''}`)
      }
    })
    lines.forEach((l, i) => {
      summary += l + (i + 1 === lines.length - 1 ? ' and ' : i + 1 < lines.length ? ', ' : '')
    })
    return summary
  },
  // Takes a points collection and adds an isSignificant property to key points
  simplify: (points, tolerance) => {
    points = points.map(obj => ({ ...obj, timestamp: parseInt((new Date(obj.dateTime)).getTime()) }))
    const significant = douglasPeucker(points, tolerance)
    const result = points.map((obj, i) => ({
      dateTime: obj.dateTime,
      value: obj.value,
      type: obj.type,
      isSignificant: !!significant.find(x => x.timestamp === obj.timestamp)
    }))
    return result
  }
}
