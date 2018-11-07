const nunjucks = require('nunjucks')
const config = require('../config')
const pkg = require('../../package.json')
const analyticsAccount = config.analyticsAccount

module.exports = {
  plugin: require('vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            const html = template.render(context /* , function (err, value) {
              console.error(err)
            } */)
            return html
          }
        },
        prepare: (options, next) => {
          const env = options.compileOptions.environment = nunjucks.configure(options.path, {
            autoescape: true,
            watch: false
          })

          env.addGlobal('getContext', function (component, errors) {
            const ctx = this.ctx
            return ctx
          })

          return next()
        }
      }
    },
    path: [
      'server/views',
      'node_modules/govuk-frontend/',
      'node_modules/govuk-frontend/components/',
      'node_modules/digital-form-builder-engine/views',
      'node_modules/digital-form-builder-designer/views'
    ],
    isCached: !config.isDev,
    context: {
      appVersion: pkg.version,
      assetPath: '/assets',
      serviceName: 'Flood information service',
      analyticsAccount: analyticsAccount
    }
  }
}
