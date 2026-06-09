module.exports = {
  method: 'GET',
  path: '/what-happens-after-a-flood',
  options: {
    description: 'what-happens-after-a-flood - Permanent (HTTP 301) redirect to external government guidance page',
    handler: async (_request, h) => h.redirect('https://www.gov.uk/after-flood').code(301)
  }
}
