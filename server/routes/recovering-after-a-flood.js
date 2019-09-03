module.exports = {
  method: 'GET',
  path: '/recovering-after-a-flood',
  options: {
    description: 'How to recover after a flood - GOV.UK',
    handler: {
      view: {
        template: 'recovering-after-a-flood',
        context: {
          pageTitle: 'How to recover after a flood',
          heading: 'Flood information service'
        }
      }
    }
  }
}
