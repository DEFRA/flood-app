const nunjucks = require('nunjucks')
const util = require('../util')
const config = require('../config')
const pkg = require('../../package.json')
const { floodFisUrl, gaFourAccId, gtmAccId } = config

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
          env.addFilter('toMarked', util.toMarked)
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
      stage: config.stage,
      appVersion: pkg.version,
      assetPath: '/assets',
      serviceName: 'Check for flooding',
      webchat: {
        enabled: config.webchat.enabled,
        brandId: config.webchat.brandId,
        channelId: config.webchat.channelId,
        environment: config.webchat.environment,
        audioUrl: config.webchat.audioUrl
      },
      floodFisUrl,
      gaFourAccId,
      gtmAccId
    }
  }
}
