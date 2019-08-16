
module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood/getting-a-flood-warning',
  options: {
    handler: {
      view: {
        template: 'getting-a-flood-warning',
        context: {
          pageTitle: 'What to do in a flood - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
