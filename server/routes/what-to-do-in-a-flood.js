const { HTTP_MOVED_PERMANENTLY } = require('../constants')

module.exports = {
  method: 'GET',
  path: '/what-to-do-in-a-flood',
  options: {
    description: 'what-to-do-in-a-flood - Permanent (HTTP 301) redirect to external government guidance page',
    handler: async (_request, h) => h.redirect('https://www.gov.uk/guidance/flood-alerts-and-warnings-what-they-are-and-what-to-do').code(HTTP_MOVED_PERMANENTLY)
  }
}
