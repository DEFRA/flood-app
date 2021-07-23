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

  acceptButton.addEventListener('click', function (e) {
    e.preventDefault()
    window.flood.utils.setCookie('set_cookie_usage', 'true', 30)
    window.flood.utils.setCookie('seen_cookie_message', 'true', 30)
    window.flood.utils.setCookie('_ga', 'true', 1)
    window.flood.utils.setCookie('_gid', 'true', 1)
    window.flood.utils.setCookie('_gat', 'true', 1)

    document.getElementById('cookie-message').style.display = 'none'
    document.getElementById('cookie-confirmation-type').innerText = 'accepted'
    document.getElementById('cookie-confirmation').removeAttribute('style')
  })
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
      window.flood.utils.setCookie('_ga', 'true', 1)
      window.flood.utils.setCookie('_gat', 'true', 1)
      window.flood.utils.setCookie('_gid', 'true', 1)
    } else {
      window.flood.utils.setCookie('set_cookie_usage', '', -1)
      window.flood.utils.setCookie('_ga', '', -1)
      window.flood.utils.setCookie('_gat', '', -1)
      window.flood.utils.setCookie('_gid', '', -1)
    }
    const alert = document.getElementById('cookie-notification')
    alert.removeAttribute('style')
    alert.focus()
  })
}
