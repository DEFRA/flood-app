module.exports = {
  method: 'GET',
  path: '/find-location',
  options: {
    description: 'find-location - Permanent (HTTP 301) redirect to main page',
    handler: async (_request, h) => h.redirect('/').code(301)
  }
}
