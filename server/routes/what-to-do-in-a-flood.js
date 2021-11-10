module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood',
  options: {
    handler: {
      view: {
        template: 'what-to-do-in-a-flood',
        context: {
          pageTitle: 'What to do in a flood - Check for flooding'
        }
      }
    }
  }
}
