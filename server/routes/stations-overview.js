module.exports = {
  method: 'GET',
  path: '/stations-overview',
  handler: async (request, h) => {
    return h.view('stations-overview', {
      stations: await request.server.methods.flood.getStationsOverview()
    })
  }
}
