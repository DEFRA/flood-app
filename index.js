const createServer = require('./server')
const pino = require('./server/lib/pino')

createServer()
  .then((server) => {
    server.start()
  })
  .catch(err => {
    pino.fatal({
      data: {
        situation: 'UNEXPECTED_FATAL_ERROR',
        stack: err.stack
      }
    })
    process.exit(1)
  })
