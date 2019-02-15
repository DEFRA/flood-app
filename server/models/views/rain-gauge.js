const moment = require('moment-timezone')

// Generate some data
var startTime = moment('2019-02-18T09:00:00Z')
var values = [0, 0, 1, 2, 2, 2, 2, 2, 3, 3, 1, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0]
var fifteen = []
// Generate vertical axis values
var vMaxValue = 5 // Vertical axis max
if (Math.max.apply(Math, values) > vMaxValue) {
  vMaxValue = Math.max.apply(Math, values) + 1
}
var vTickValue = Math.ceil((vMaxValue + 1) / 6) // Vertical tick value
var vTicksCount = Math.floor(vMaxValue/vTickValue) // Number of vertical ticks
var vTickPercentile = ((100/vMaxValue)*vTickValue).toFixed(2) // Percentage spacing of each tick
// H axis config
var hTickFirstOffset = 2
var hTickIncrement = 3
var hTickPercentile = (100/24).toFixed(2)
// Generate records
for (var i = 0; i < 24; i++) {
  var dateTime = startTime.add(15, 'minutes')
  var column = {
    'timestamp': dateTime.format(),
    'period': dateTime.format('HH:mm'),
    'value': values[i],
    'vPercentile': ((100/vMaxValue)*values[i]).toFixed(2),
    'hPercentile': (i * hTickPercentile),
    'hWidthPercentile': hTickPercentile,
    'isTick': false
  }
  if ((i+hTickFirstOffset) % hTickIncrement === 0) {
    // THis is also an hTick tick
    column.isTick = true 
  }
  fifteen.push(column)
}

class ViewModel {
  constructor (name) {
    this.name = 'Monksilver'
    this.gridRef = 'SS763417'
    this.coordinates = [-3.77, 51.16]
    this.fifteen = fifteen
    this.vAxisFifteen = {
      'vMaxValue': vMaxValue,
      'vTickValue': vTickValue,
      'vTicksCount': vTicksCount + 1, // Added for 0 tick
      'vTickPercentile': vTickPercentile
    }
  }
}

module.exports = ViewModel
