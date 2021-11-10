module.exports = {
  method: 'GET',
  path: '/accessibility-statement',
  options: {
    description: 'Accessibility statement',
    handler: {
      view: {
        template: 'accessibility-statement',
        context: {
          pageTitle: 'Accessibility statement - Check for flooding'
        }
      }
    }
  }
}
