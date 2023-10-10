'use strict'
const pino = require('pino')
const { jsonLogging } = require('../config')

const target = jsonLogging ? 'pino/file' : 'pino-pretty'
const pinoOptions = {
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {},
  formatters: {
    level (label, number) {
      return { logLevel: label.toUpperCase(), level: number }
    }
  }
}
const pinoTransport = pino.transport({
  targets: [
    { target, level: 'error', options: { destination: 2 } },
    { target, options: { destination: 1 } }
  ],
  dedupe: true
})

module.exports = {
  plugin: require('hapi-pino'),
  options: {
    logRequestComplete: false,
    instance: pino(pinoOptions, pinoTransport),
    serializers: {
      req (req) {
        const retVal = {
          method: req.method.toUpperCase(),
          url: req.url
        }
        if (req.query.length) {
          retVal.query = req.query
        }
        return retVal
      },
      res (res) {
        return {
          statusCode: res.statusCode
        }
      }
    }
  }
}
