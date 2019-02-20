const moment = require('moment-timezone')

function Graph (period, endTime, values, threshold) {
  // End time on horizontal axis
  // var end = moment('2019-02-18T15:00:00Z')

  // Hourly intervals over 24 hours
  var end = moment(endTime).subtract(moment(endTime).minute(), 'minutes')
  var startTime = end.subtract(24, 'hours')

  // 15 minute intervals over 6 hours
  if (period === 'minutes') {
    var remainder = end.minute() % 15
    endTime = moment(end).subtract(remainder, 'minutes')
    startTime = endTime.subtract(6, 'hours')
  }

  // Axis config
  var verticalAxisMax = 30
  if (period === 'minutes') {
    verticalAxisMax = 10
  }
  var hTickFirstOffset = 2
  var hTickIncrement = 3
  var hTickPercentile = (100 / 24).toFixed(4)

  // Generate vertical axis values
  var vMaxValue = Math.max.apply(Math, values) + 1 // Vertical axis max

  // Set vertical axis to fixed upper value
  if (vMaxValue < verticalAxisMax) {
    vMaxValue = verticalAxisMax
  }

  // Extend vertical axis for threshold
  if (vMaxValue < threshold) {
    vMaxValue = threshold + 1
  }

  // Calculate tick values and counts
  var vTickValue = Math.ceil((vMaxValue + 1) / 6) // Vertical tick value
  var vTicksCount = Math.floor(vMaxValue / vTickValue) // Number of vertical ticks

  // Extend vertical axis if max value does not fall on a tick
  if (vTickValue * vTicksCount < vMaxValue) {
    vTicksCount++
    vMaxValue = vTicksCount * vTickValue
  }

  // Add one extra vertical tick
  vTicksCount++ // Added for 0 tick

  // Calculate percentage spacing for each tick
  var vTickPercentile = ((100 / vMaxValue) * vTickValue).toFixed(2)

  // Generate records
  var columns = []
  for (var i = 0; i < 24; i++) {
    var column = {
      'timestamp': startTime.format(),
      'period': startTime.format('HH:mm'),
      'value': values[i],
      'vPercentile': ((100 / vMaxValue) * values[i]).toFixed(2),
      'hPercentile': (i * hTickPercentile),
      'hWidthPercentile': hTickPercentile,
      'isTick': false
    }
    if ((i + hTickFirstOffset) % hTickIncrement === 0) {
      // THis is also an hTick tick
      column.isTick = true
    }
    columns.push(column)
    if (period === 'hours') {
      startTime.add(1, 'hours')
    } else {
      startTime.add(15, 'minutes')
    }
  }

  // Calculate threshold height
  var thresholdPercentile = threshold > 0 ? ((100 / vMaxValue) * threshold).toFixed(2) : -1

  // Graph object
  return {
    'columns': columns,
    'vMaxValue': vMaxValue,
    'vTickValue': vTickValue,
    'vTicksCount': vTicksCount,
    'vTickPercentile': vTickPercentile,
    'threshold': (threshold > 0) ? threshold : '',
    'thresholdPercentile': (thresholdPercentile > 0) ? thresholdPercentile : ''
  }
}

class ViewModel {
  constructor (rainGauge, rainMeasures) {
    this.name = rainGauge.items.label
    this.gridRef = rainGauge.items.gridReference
    this.coordinates = [rainGauge.items.long, rainGauge.items.lat]
    this.graphMinutes = new Graph(
      'minutes',
      new Date(),
      [1, 0, 1, 2, 2, 2, 2, 2, 1, 1, 1, 2, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0],
      6
    )
    this.graphHours = new Graph(
      'hours',
      new Date(),
      [0, 0, 5, 8, 7, 7, 8, 6, 0, 1, 1, 2, 0, 0, 0, 2, 1, 0, 1, 8, 5, 2, 3, 0],
      24
    )
  }
}

module.exports = ViewModel
