module.exports = {
  method: 'GET',
  path: '/plan-ahead-for-flooding',
  options: {
    description: 'How to plan ahead for flooding - GOV.UK',
    handler: {
      view: {
        template: 'plan-ahead-for-flooding',
        context: {
          pageTitle: 'How to plan ahead for flooding - Check for flooding'
        }
      }
    }
  }
}
