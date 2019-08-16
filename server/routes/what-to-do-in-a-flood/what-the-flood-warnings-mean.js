module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood/what-the-flood-warnings-mean',
  options: {
    handler: {
      view: {
        template: 'what-the-flood-warnings-mean',
        context: {
          pageTitle: 'What to do in a flood - GOV.UK',
          heading: 'Flood information service'
        }
      }
    }
  }
}
