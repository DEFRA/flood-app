module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood/getting-a-flood-alert',
  options: {
    handler: {
      view: {
        template: 'getting-a-flood-alert',
        context: {
          pageTitle: 'What to do in a flood - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
