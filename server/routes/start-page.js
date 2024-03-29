module.exports = {
  method: 'GET',
  path: '/start-page',
  options: {
    description: 'start-page - Permanent (HTTP 301) redirect to gov.uk/check-flooding',
    handler: async (_request, h) => h.redirect('https://www.gov.uk/check-flooding').code(301)
  }
}
