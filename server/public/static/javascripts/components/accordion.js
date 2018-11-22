(function (flood) {
  function Accordion (accordion) {
    if (accordion) {
      //
      // Defaults
      //

      var defaults = {}
      var options = Object.assign(defaults, options)

      //
      // Setup
      //

      var sections = accordion.querySelectorAll('.accordion__section')

      Array.prototype.forEach.call(sections, function (section) {
        var header = section.querySelector('.accordion__section-header')
        header.setAttribute('role', 'button')
        var sectionTitle = section.querySelector('.accordion__section-title, .accordion__section-title-s')
        var content = section.querySelector('.accordion__section-content')
        var button = document.createElement('button')
        button.innerHTML = sectionTitle.innerHTML
        button.className = 'accordion__button'
        button.setAttribute('aria-expanded', false)
        button.setAttribute('aria-controls', content.getAttribute('id'))
        sectionTitle.innerHTML = ''
        sectionTitle.appendChild(button)
        var icon = document.createElement('span')
        icon.className = 'accordion__section-icon'
        header.appendChild(icon)

        //
        // Events
        //

        header.addEventListener('click', function (e) {
          this.closest('.accordion__section').classList.toggle('accordion__section--open')
        })
      })
    }
  }

  flood.Accordion = Accordion
})(window.flood)
