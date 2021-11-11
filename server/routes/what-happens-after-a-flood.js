module.exports = {
  method: 'GET',
  path: '/what-happens-after-a-flood',
  options: {
    description: 'What happens after a flood - GOV.UK',
    handler: {
      view: {
        template: 'what-happens-after-a-flood',
        context: {
          pageTitle: 'What happens after a flood - Check for flooding'
        }
      }
    }
  }
}
