module.exports = {
  method: 'GET',
  path: '/how-we-measure-river-sea-groundwater-levels',
  options: {
    description: 'How we measure river, sea and groundwater levels - Flood information service - GOV.UK',
    handler: {
      view: {
        template: 'about-levels',
        context: {
          pageTitle: 'How we measure river, sea and groundwater levels',
          heading: 'Flood information service'
        }
      }
    }
  }
}
