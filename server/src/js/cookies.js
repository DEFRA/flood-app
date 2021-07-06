const container = document.getElementById('cookie-accept')

// JS/Non-JS content - We may already havea helper on live for this
const nonJsElements = document.getElementsByClassName('defra-no-js')
Array.prototype.forEach.call(nonJsElements, function (element) {
  element.style.display = 'none'
})
const jsElements = document.getElementsByClassName('defra-js')
Array.prototype.forEach.call(jsElements, function (element) {
  element.removeAttribute('style')
})

if (container) {
  const acceptButton = document.createElement('button')
  acceptButton.className = 'defra-cookie-banner__button-accept'
  acceptButton.innerText = 'Accept all cookies'
  container.parentNode.replaceChild(acceptButton, container)

  acceptButton.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.utils.setCookie('is_cookie_accepted', 'true', 7)
    window.flood.utils.setCookie('is_cookie_prefs_set', 'true', 7)

    document.getElementById('cookie-message').style.display = 'none'
    document.getElementById('cookie-confirmation').removeAttribute('style')
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
    // TODO: Get radio button setting and set or delete cookie (setCookie with -1)
    e.preventDefault()
    const useCookies = document.querySelectorAll('input[name="sign-in"]')
    window.flood.utils.setCookie('is_cookie_prefs_set', 'true', 7)
    if (useCookies[0].checked) {
      window.flood.utils.setCookie('is_cookie_accepted', 'true', 7)
    } else {
      window.flood.utils.setCookie('is_cookie_accepted', '', -1)
      window.flood.utils.setCookie('_ga', '', -1)
      window.flood.utils.setCookie('_gat', '', -1)
      window.flood.utils.setCookie('_gid', '', -1)
    }
    const alert = document.getElementById('cookie-save-confirmation')
    if (document.getElementById('cookie-banner')) {
      document.getElementById('cookie-banner').style.display = 'none'
    }
    alert.removeAttribute('style')
    alert.focus()
  })
}
