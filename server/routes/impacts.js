module.exports = {
  method: 'GET',
  path: '/previous-impacts',
  handler: async (request, h) => {
    const model = {}
    model.referer = request.headers.referer
    return h.view('impacts', { model })
  }
}
