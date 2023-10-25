'use strict'
const { Notifier } = require('@airbrake/node')
const createAbstractTransport = require('pino-abstract-transport')

module.exports = ({ severity, enabled, host, projectId, projectKey, environment, version }) => {
  let airbrake

  if (enabled) {
    airbrake = new Notifier({
      host,
      projectId,
      projectKey,
      environment,
      errorNotifications: true,
      remoteConfig: false
    })

    airbrake.addFilter(notice => {
      notice.context.environment = environment
      notice.context.version = version
      notice.context.severity = severity
      return notice
    })
  }

  return createAbstractTransport(async source => {
    for await (const data of source) {
      const sendToErrbit = !!airbrake && !!data?.err
      if (sendToErrbit) {
        const notification = {
          error: data.err,
          context: {},
          params: {}
        }
        if (data.req) {
          notification.context.httpMethod = data.req.method
          notification.context.route = data.req.url
          notification.params.request = data.req
        }
        if (data.res) {
          notification.params.response = data.res
        }
        await airbrake
          .notify(notification)
          .catch(console.error)
      }
    }
  }, {
    async close () {
      if (airbrake) {
        await airbrake.flush(1000)
      }
    }
  })
}
