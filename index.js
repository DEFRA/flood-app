const createServer = require('./server')
const config = require('./server/config')

createServer()
  .then((server) => {
    server.start()
    if (config.mockExternalHttp) {
      require('./mock')
      server.log('info', 'External requests are being mocked')
    }
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
