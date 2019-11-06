const fs = require('fs')
const data = []
const files = fs.readdirSync('./test/data/')

files.forEach(function (file) {
  if (file.indexOf('.json') > -1) {
    data[file.replace('.json', '')] = require('./' + file)
  }
})

module.exports = data
