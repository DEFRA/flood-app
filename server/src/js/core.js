'use strict'
// "flood" represents the global namespace for
// client-side javascript across all our pages
window.flood = {
  utils: {
    xhr: (url, callback) => {
      const xmlhttp = new window.XMLHttpRequest()

      xmlhttp.onreadystatechange = () => {
        if (this.readyState === 4 && this.status === 200) {
          try {
            const json = JSON.parse(this.responseText)
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
    addOrUpdateParameter: (uri, paramKey, paramVal) => {
      const re = new RegExp('([?&])' + paramKey + '=[^&#]*', 'i')
      // Delete parameter and value
      if (paramVal === '') {
        uri = uri.replace(re, '')
      } else if (re.test(uri)) {
        // Replace parameter value
        uri = uri.replace(re, '$1' + paramKey + '=' + paramVal)
        // Add parameter and value
      } else {
        const separator = /\?/.test(uri) ? '&' : '?'
        uri = uri + separator + paramKey + '=' + paramVal
      }
      return uri
    },
    getParameterByName: (name) => {
      const v = window.location.search.match(new RegExp('(?:[?&]' + name + '=)([^&]+)'))
      return v ? v[1] : null
    },
    addBrowserBackButton: () => {
      const container = document.getElementById('browserBackContainer')
      if (container) {
        let nav
        if (container.nodeName.toLowerCase() !== 'nav') {
          nav = document.createElement('nav')
          container.appendChild(nav)
        } else {
          nav = container
        }
        const hyperlink = document.createElement('a')
        hyperlink.href = document.referrer
        hyperlink.href = hyperlink.pathname + hyperlink.search
        hyperlink.innerText = 'Back'
        hyperlink.className = 'govuk-back-link govuk-!-margin-bottom-7 govuk-!-margin-right-2'
        hyperlink.addEventListener('click', function (e) {
          e.preventDefault()
          window.history.back()
        })
        // ie 11 prepend hack
        // nav.prepend(hyperlink)
        nav.insertBefore(hyperlink, nav.childNodes[0])
      }
    }
  }
}
