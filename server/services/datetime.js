const config = require('../config')
const fixedDate = config.date

module.exports = {
  now () {
    return fixedDate || Date.now()
  }
}
