module.exports = {
  method: 'GET',
  path: '/river-sea-levels',
  handler: async (request, h) => {
    const model = {}
    model.referer = request.headers.referer
    return h.view('levels', { model })
  }
}