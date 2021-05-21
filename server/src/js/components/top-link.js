'use strict'
// Back to top link component

const TopLink = (settings) => {
  const backToTop = document.querySelector('.defra-top-link')
  const topElement = settings.topElement
  const bottomElement = settings.bottomElement

  const scroll = () => {
    const scrollTop = document.body.scrollTop || document.documentElement.scrollTop
    // We need to calculate offset in here as this can change
    const offsetTop = topElement.offsetTop + topElement.offsetHeight
    const offsetBottom = bottomElement.offsetTop - window.innerHeight
    if (scrollTop >= offsetTop && scrollTop <= offsetBottom) {
      backToTop.classList.add('defra-top-link--fixed')
    } else {
      backToTop.classList.remove('defra-top-link--fixed')
    }
  }

  window.addEventListener('load', scroll)
  window.addEventListener('scroll', scroll)
}

window.flood.createTopLink = (settings) => {
  return TopLink(settings)
}
