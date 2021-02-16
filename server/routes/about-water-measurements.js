module.exports = {
  method: 'GET',
  path: '/about-water-measurements',
  options: {
    description: 'About water measurements - GOV.UK',
    handler: {
      view: {
        template: 'about-water-measurements',
        context: {
          pageTitle: 'About water measurements',
          heading: 'Check for flooding'
        }
      }
    }
  }
}
