const moment = require('moment-timezone')

function Graph (period, endTime, values, threshold) {
  // End time on horizontal axis
  // var end = moment('2019-02-18T15:00:00Z')

  // Hourly intervals over 24 hours
  var end = moment(endTime).subtract(moment(endTime).minute(), 'minutes')
  var startTime = end.subtract(23, 'hours')

  // 15 minute intervals over 6 hours
  if (period === 'minutes') {
    startTime = moment(endTime).subtract(5, 'hours').subtract(45, 'minutes')
  }

  // Daily intervals over 28 days
  if (period === 'days') {
    startTime = moment(endTime).subtract(27, 'days')
  }

  // Axis config
  var verticalAxisMax = 0
  if (period === 'minutes') {
    verticalAxisMax = 10
  } else if (period === 'hours') {
    verticalAxisMax = 30
  } else if (period === 'days') {
    verticalAxisMax = 250
  }
  var hTickFirstOffset = 2
  var hTickIncrement = 3
  var hTickPercentile = (100 / values.length).toFixed(4)

  // Generate vertical axis values
  var vMaxValue = Math.max.apply(Math, values) // Vertical axis max

  // Extend vertical axis for fixed upper value
  if (vMaxValue < verticalAxisMax) {
    vMaxValue = verticalAxisMax
  }

  // Extend vertical axis for threshold plus buffer
  if (vMaxValue < threshold) {
    if (period === 'minutes') {
      vMaxValue = threshold + 1
    } else if (period === 'hours') {
      vMaxValue = threshold + 5
    } else if (period === 'days') {
      vMaxValue = threshold + 50
    }
  }

  // Calculate tick values and counts
  var vTickValue = Math.ceil((vMaxValue) / 5) // Vertical tick value
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
  for (var i = 0; i < values.length; i++) {
    var column = {
      'timestamp': startTime.format(),
      'period': period === 'days' ? startTime.format('DD/MM') : startTime.format('HH:mm'),
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
    if (period === 'mins') {
      startTime.add(15, 'minutes')
    } else if (period === 'hours') {
      startTime.add(1, 'hours')
    } else if (period === 'days') {
      startTime.add(1, 'day')
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
    // Static gauge properties
    this.name = rainGauge.items.label
    this.gridRef = rainGauge.items.gridReference
    this.coordinates = [rainGauge.items.long, rainGauge.items.lat]
    //
    // 6 hour data
    //
    let endDateMinutes = rainMeasures.items[0].dateTime // Start from latest entry
    let measuresMinutes = rainMeasures.items.slice(0, 24).map(a => a.value).reverse() // reversed for display
    this.graphMinutes = new Graph(
      'minutes',
      new Date(endDateMinutes),
      measuresMinutes,
      6
    )
    //
    // 1 day data
    //
    var endDateHours
    var measuresHours = []
    var startIndex = -1
    // Set start index and endDate
    for (startIndex = 0; startIndex < 4; startIndex++) {
      if (moment(rainMeasures.items[startIndex].dateTime).minute() === 0) {
        endDateHours = rainMeasures.items[startIndex].dateTime
        break
      }
    }
    // Iterate through remaining items in batches of 4
    for (var i = startIndex; i < (startIndex + 96); i += 4) {
      // Sum values
      var hourTotal = 0
      for (var n = i; n < (i + 4); n++) {
        hourTotal += rainMeasures.items[n].value
      }
      // Add total for hour
      measuresHours.push(hourTotal)
    }
    measuresHours.reverse() // Reversed for display
    this.graphHours = new Graph(
      'hours',
      new Date(endDateHours),
      measuresHours,
      24
    )
    //
    // 28 day data
    //
    var endDateDays
    var measuresDays = []
    startIndex = -1
    // Set start index and endDate
    for (startIndex = 0; startIndex < 96; startIndex++) {
      if (moment(rainMeasures.items[startIndex].dateTime).minute() === 45 && moment(rainMeasures.items[startIndex].dateTime).hour() === 23) {
        endDateDays = rainMeasures.items[startIndex].dateTime
        break
      }
    }
    // Iterate through remaining items in batches of 96
    for (i = startIndex; i < (startIndex + 2688); i += 96) {
      // Sum values
      var dayTotal = 0
      for (n = 0; n < 96; n++) {
        dayTotal += rainMeasures.items[i + n].value
      }
      // Add total for hour
      measuresDays.push(dayTotal)
    }
    console.log(measuresDays[0], measuresDays[1], measuresDays[2], measuresDays[3])
    measuresDays.reverse() // Reversed for display
    this.graphDays = new Graph(
      'days',
      new Date(endDateDays),
      measuresDays,
      120
    )
  }
}

module.exports = ViewModel
