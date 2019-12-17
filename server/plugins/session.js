const config = require('../config')

module.exports = {
  plugin: require('@hapi/yar'),
  options: {
    cookieOptions: {
      password: config.sessionPassword,
      isSecure: config.siteUrl.substring(0, 5) === 'https',
      isHttpOnly: false
    },
    maxCookieSize: 1024
  }
}
