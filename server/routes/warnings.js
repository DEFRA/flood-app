module.exports = {
  method: 'GET',
  path: '/warnings',
  handler: async (request, h) => {
    const model = {}
    model.referer = request.headers.referer
    return h.view('warnings', { model })
  }
}
