'use strict'
const pino = require('pino')
const { isPM2, logLevel } = require('../config')
const { join } = require('path')
const logDir = join(__dirname, '../../logs')

const transport = pino.transport({
  targets: [
    {
      target: isPM2 ? 'pino/file' : 'pino-pretty',
      level: 'error',
      options: {
        destination: isPM2 ? join(logDir, '.pino.err.log') : 2,
        mkdir: true
      }
    },
    {
      target: isPM2 ? 'pino/file' : 'pino-pretty',
      options: {
        destination: isPM2 ? join(logDir, '.pino.out.log') : 1,
        mkdir: true
      }
    }
  ],
  dedupe: true
})

module.exports = pino({
  level: logLevel.toLowerCase(),
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {},
  formatters: {
    level: (label, number) => ({
      logLevel: label.toUpperCase(),
      level: number
    })
  }
}, transport)
