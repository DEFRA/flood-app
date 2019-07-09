module.exports = {
  method: 'GET',
  path: '/river-and-sea-levels',
  handler: async (request, h) => {
    const model = {}
    model.referer = request.headers.referer
    return h.view('levels', { model })
  }
}
