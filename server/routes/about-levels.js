module.exports = {
  method: 'GET',
  path: '/how-we-measure-river-sea-groundwater-levels',
  options: {
    description: 'How we measure river, sea and groundwater levels',
    handler: {
      view: {
        template: 'about-levels',
        context: {
          pageTitle: 'How we measure river, sea and groundwater levels - Check for flooding'
        }
      }
    }
  }
}
