module.exports = {
  method: 'GET',
  path: '/plan-ahead-for-flooding',
  options: {
    description: 'How to plan ahead for flooding - GOV.UK',
    handler: {
      view: {
        template: 'plan-ahead-for-flooding',
        context: {
          pageTitle: 'Give your consent before using the flood information service prototype',
          heading: 'Flood information service'
        }
      }
    }
  }
}
