module.exports = [
  {
    method: 'GET',
    path: '/outside-england',
    handler: async function (_request, h) {
      const model = {
        pageTitle: 'Error: Find location - Check for flooding'
      }
      return h.view('outside-england', { model })
    }
  }
]
