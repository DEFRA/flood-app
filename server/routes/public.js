module.exports = [{
  method: 'GET',
  path: '/robots.txt',
  options: {
    handler: {
      file: 'server/dist/robots.txt'
    }
  }
}, {
  method: 'GET',
  path: '/assets/{path*}',
  options: {
    plugins: {
      'hapi-rate-limit': {
        enabled: false
      }
    },
    handler: {
      directory: {
        path: [
          'server/dist',
          'node_modules/govuk-frontend/govuk/assets',
          'node_modules/accessible-autocomplete/dist',
          'node_modules/nunjucks/browser'
        ]
      }
    }
  }
}]
