const nunjucks = require('nunjucks')
const util = require('../util')
const config = require('../config')
const pkg = require('../../package.json')
const { gaAccId, gaOptId, fbAppId } = config

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          const env = options.compileOptions.environment = nunjucks.configure(options.path)

          env.addFilter('formatDate', util.formatDate)
          env.addFilter('toFixed', util.toFixed)

          return next()
        }
      }
    },
    path: [
      'server/views',
      'node_modules/govuk-frontend/govuk',
      'node_modules/govuk-frontend/govuk/components/'
    ],
    isCached: true,
    context: {
      env: config.env,
      appVersion: pkg.version,
      assetPath: '/assets',
      serviceName: 'Check flood risk',
      gaAccId,
      gaOptId,
      fbAppId
    }
  }
}
