const createServer = require('./server')
const config = require('./server/config')
const pkg = require('./package.json')

createServer()
  .then((server) => {
    server.start()
    console.log('flood-app (%s) running on %s', pkg.version, server.info.uri)
    if (config.fakeBingCall) {
      server.log('info', 'Bing requests are being faked')
    }
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
