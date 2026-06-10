const { HTTP_MOVED_PERMANENTLY } = require('../constants')

module.exports = {
  method: 'GET',
  path: '/plan-ahead-for-flooding',
  options: {
    description: 'plan-ahead-for-flooding - Permanent (HTTP 301) redirect to external government guidance page',
    handler: async (_request, h) => h.redirect('https://www.gov.uk/prepare-for-flooding').code(HTTP_MOVED_PERMANENTLY)
  }
}
