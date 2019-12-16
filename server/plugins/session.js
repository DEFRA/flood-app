const config = require('../config')

module.exports = {
  plugin: require('@hapi/yar'),
  options: {
    cookieOptions: {
      password: Array(32).fill(0).map(x => Math.random().toString(36).charAt(2)).join(''),
      isSecure: config.siteUrl.substring(0, 5) === 'https',
      isHttpOnly: true,
      isSameSite: 'Strict'
    },
    maxCookieSize: 0
  }
}
