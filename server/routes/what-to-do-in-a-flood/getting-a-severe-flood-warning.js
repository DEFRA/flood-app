
module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood/getting-a-severe-flood-warning',
  options: {
    description: 'Check your risk of flooding: get current flood warnings, river and sea levels, check the 5-day forecast or use flood risk maps',
    handler: {
      view: {
        template: 'getting-a-severe-flood-warning',
        context: {
          pageTitle: 'What to do in a flood - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
