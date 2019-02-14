const moment = require('moment-timezone')

// Generate some data
function data () {
  var startTime = moment('2019-02-18T09:00:00Z')
  var values = [0, 0, 1, 2, 2, 2, 2, 2, 3, 3, 1, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 0, 0]
  var fifteen = []
  for (var i = 0; i <= values.length; i++) {
    // startTime.add(15, 'minutes')
    console.log('index ' + i)
    /*
    console.log({
      'index ': i
    })
    /*
    var dateTime = startTime.add(15, 'minutes')
    fifteen.push({
      'timestamp': dateTime.format(),
      'period': dateTime.format('HH:mm'),
      'value': value + 'mm'
    })
    console.log({
      'index': i,
      'timestamp': dateTime.format(),
      'period': dateTime.format('HH:mm'),
      'value': values[i] + 'mm'
    })
    */
  }
  return startTime
}

class ViewModel {
  constructor (name) {
    data()
    this.name = 'Monksilver'
    this.gridRef = 'SS763417'
    this.coordinates = [-3.77, 51.16]
    this.fifteen = [
      {
        'dateTime': '2019-02-18T09:00:00Z',
        'period': '9:00',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T09:15:00Z',
        'period': '9:15',
        'value': 1
      },
      {
        'dateTime': '2019-02-18T09:30:00Z',
        'period': '9:30',
        'value': 2
      },
      {
        'dateTime': '2019-02-18T09:45:00Z',
        'period': '9:15',
        'value': 2
      },
      {
        'dateTime': '2019-02-18T10:00:00Z',
        'value': 3
      },
      {
        'dateTime': '2019-02-18T10:15:00Z',
        'value': 1
      },
      {
        'dateTime': '2019-02-18T10:30:00Z',
        'value': 1
      },
      {
        'dateTime': '2019-02-18T10:45:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T11:00:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T11:15:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T11:30:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T11:45:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T12:00:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T12:15:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T12:30:00Z',
        'value': 2
      },
      {
        'dateTime': '2019-02-18T12:45:00Z',
        'value': 3
      },
      {
        'dateTime': '2019-02-18T13:00:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T13:15:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T13:30:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T13:45:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T14:00:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T14:15:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T14:30:00Z',
        'value': 0
      },
      {
        'dateTime': '2019-02-18T14:45:00Z',
        'value': 0
      }
    ]
  }
}

module.exports = ViewModel
