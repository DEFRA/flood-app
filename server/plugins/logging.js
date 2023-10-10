'use strict'
const pino = require('pino')
const { jsonLogging } = require('../config')

const target = jsonLogging ? 'pino/file' : 'pino-pretty'
const pinoOptions = {
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {},
  formatters: {
    level: (label, number) => ({
      logLevel: label.toUpperCase(),
      level: number
    })
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
      req: req => ({
        method: req.method.toUpperCase(),
        url: req.url,
        query: Object.keys(req.query || {}).length ? req.query : undefined
      }),
      res: res => ({
        statusCode: res.statusCode
      })
    }
  }
}
