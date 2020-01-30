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
  path: '/assets/all.js',
  options: {
    handler: {
      file: 'node_modules/govuk-frontend/govuk/all.js'
    }
  }
}, {
  method: 'GET',
  path: '/assets/{path*}',
  options: {
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
