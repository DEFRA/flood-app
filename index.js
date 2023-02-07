const createServer = require('./server')
const config = require('./server/config')
const pkg = require('./package.json')

createServer()
  .then((server) => {
    server.start()
    console.log('flood-app (%s) running on %s', pkg.version, server.info.uri)
  })
  .catch(err => {
    console.log(err)
    process.exit(1)
  })
