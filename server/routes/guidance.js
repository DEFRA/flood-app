module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood',
  handler: async (request, h) => {
    return h.view('what-to-do-in-a-flood')
  }
}
