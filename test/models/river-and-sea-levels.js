'use strict'

const { referencedStationViewModel, placeViewModel, riverViewModel, areaViewModel, emptyResultsModel } = require('../../server/models/views/river-and-sea-levels')
const data = require('../data')

describe('Model - River and Sea Levels', () => {
  describe('placeViewModel', () => {
    it('should return stations', async () => {
      const stationsData = data.riverAndSeaLevelData

      const model = placeViewModel(stationsData)

      expect(model.stations.length).toBe(76)
      expect(model.stations[0].river_name).toBe('Valley Brook')
      expect(model.stations[0].region).toBe('North West')
    })

    it('should return stations in distance order from place', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const firstStation = data.riverAndSeaLevelDataUnordered.stations[0]
      const model = placeViewModel(stationsData)

      expect(model.stations[2].distance).toBeGreaterThan(model.stations[1].distance)
      expect(model.stations[0].river_name).not.toBe(firstStation.river_name)
      expect(model.stations[0].region).toBe('North West')
    })

    it('should filter stations into groups', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      expect(model.filters[0].count).toBe(74)
      expect(model.filters[1].count).toBe(0)
      expect(model.filters[2].count).toBe(2)
      expect(model.filters[3].count).toBe(0)
    })

    it('should return formatted date time for stations', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      expect(model.stations[0].latestDatetime).toBe('Latest at 5:30am on 16 July ')
    })

    it('should return "formattedValue" with correct number of decimal places', async () => {
      const stationsData = data.riverAndSeaLevelData
      const model = placeViewModel(stationsData)

      const station = model.stations.find(item => {
        return item.station_type === 'S'
      })
      const rainfallStation = model.stations.find(item => {
        return item.station_type === 'R'
      })

      expect(station.formattedValue).toBe('0.22m')
      expect(rainfallStation.formattedValue).toBe('0m')
    })

    it('should set "displayGetWarningsLink" with the appropriate value', async () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      expect(result.displayGetWarningsLink).toBe(true)
    })

    it('should populate slug correctly', () => {
      const stationsData = data.riverAndSeaLevelData

      const result = placeViewModel(stationsData)

      expect(result.slug).toBe('cheshire')
    })

    it('should default to no stations and use the location when the place has no name', () => {
      const place = { ...data.riverAndSeaLevelData.place, name: null }

      const result = placeViewModel({ location: 'cheshire', place })

      expect(result.stations).toEqual([])
      expect(result.pageTitle).toBe('cheshire - Find river, sea, groundwater and rainfall levels')
    })

    it('should use the generic description and an empty map extent for places outside England', () => {
      const place = { ...data.riverAndSeaLevelData.place, isEngland: { is_england: false } }

      const result = placeViewModel({ location: 'cardiff', place, stations: [] })

      expect(result.isEngland).toBeFalse()
      expect(result.pageTitle).toBe('Cheshire - Find river, sea, groundwater and rainfall levels')
      expect(result.metaDescription).toStartWith('Find river, sea, groundwater and rainfall levels in England.')
      expect(result.clientModel.placeBox).toEqual([])
    })

    it('should group coastal stations on the "Sea Levels" river as sea stations', () => {
      const stations = [{ ...data.riverAndSeaLevelData.stations[0], station_type: 'C', river_id: 'Sea Levels' }]

      const result = placeViewModel({ ...data.riverAndSeaLevelData, stations })

      expect(result.stations[0].group_type).toBe('sea')
      expect(result.queryGroup).toBe('sea')
    })
  })

  describe('emptyResultsModel', () => {
    it('should prefix the page title with the query when one is provided', () => {
      expect(emptyResultsModel('cheshire').pageTitle).toBe('cheshire - Find river, sea, groundwater and rainfall levels')
    })

    it('should use the default page title when no query is provided', () => {
      expect(emptyResultsModel().pageTitle).toBe('Find river, sea, groundwater and rainfall levels')
    })
  })

  describe('areaViewModel', () => {
    it('should return an empty map extent when there are no stations', () => {
      const result = areaViewModel('011FWFNC6KC', 'Keswick', [])

      expect(result.clientModel.placeBox).toEqual([])
      expect(result.distStatement).toBe('Showing levels within 5 miles of Keswick.')
    })
  })

  describe('referencedStationViewModel', () => {
    it('should return stations sorted in distance order from rainfall station', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const model = referencedStationViewModel(referencePoint, stationsData.stations)

      expect(model.stations.length).toBe(76)
      expect(model.stations[1].distance).toBeGreaterThan(model.stations[0].distance)
      expect(model.stations[2].distance).toBeGreaterThan(model.stations[1].distance)
    })

    it('should set "displayGetWarningsLink" with the appropriate value', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered
      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const result = referencedStationViewModel(referencePoint, stationsData.stations)

      expect(result.displayGetWarningsLink).toBe(true)
    })

    it('should populate slug correctly', async () => {
      const stationsData = data.riverAndSeaLevelDataUnordered

      const [rainfallStation] = data.rainfallStation553564

      const referencePoint = {
        type: 'rainfall',
        id: 'ABC123',
        name: rainfallStation.station_name,
        lat: rainfallStation.lat,
        lon: rainfallStation.lon
      }

      const result = referencedStationViewModel(referencePoint, stationsData.stations)

      expect(result.slug).toBe('rainfall/ABC123')
    })
  })

  describe('riverViewModel', () => {
    const baseStation = {
      status: 'Active',
      value: 1.2,
      value_erred: false,
      iswales: true,
      lon: 0,
      lat: 0,
      external_name: 'Test Station',
      station_type: 'S',
      river_qualified_name: 'Test River',
      trend: 'steady',
      percentile_5: '1.0',
      percentile_95: '0.5',
      value_timestamp: '2022-03-30T12:00:00Z'
    }

    it('should return "Totals up to" formatted time for rainfall stations', async () => {
      const stations = [{ ...baseStation, station_type: 'R' }]
      const result = riverViewModel('testRiverId', stations, 'river')
      expect(result.stations[0].latestDatetime).toMatch(/^Totals up to \d+:\d+[ap]m on \d+ \w+ $/)
    })

    it('should return "Latest at" formatted time for non-rainfall stations', async () => {
      const stations = [{ ...baseStation, station_type: 'S' }]
      const result = riverViewModel('testRiverId', stations, 'river')
      expect(result.stations[0].latestDatetime).toMatch(/^Latest at \d+:\d+[ap]m on \d+ \w+ $/)
    })

    it('should not set latestDatetime when station is suspended', async () => {
      const stations = [{ ...baseStation, status: 'Suspended' }]
      const result = riverViewModel('testRiverId', stations, 'river')
      expect(result.stations[0].latestDatetime).toEqual(undefined)
    })

    it('should not set latestDatetime when value_timestamp is missing', async () => {
      const stations = [{ ...baseStation, value_timestamp: null }]
      const result = riverViewModel('testRiverId', stations, 'river')
      expect(result.stations[0].latestDatetime).toEqual(undefined)
    })

    it('should not set latestDatetime when value_timestamp is invalid', async () => {
      const stations = [{ ...baseStation, value_timestamp: 'not-a-date' }]
      const result = riverViewModel('testRiverId', stations, 'river')
      expect(result.stations[0].latestDatetime).toEqual(undefined)
    })

    it('should set displayData to true for active Welsh stations', async () => {
      const stations = [{
        status: 'Active',
        value: 1.2,
        value_erred: false,
        iswales: true,
        lon: 0,
        lat: 0,
        external_name: 'Test Station',
        station_type: 'R',
        river_qualified_name: 'Test River',
        trend: 'steady',
        percentile_5: '1.0',
        percentile_95: '0.5',
        value_timestamp: '2022-03-30T12:00:00Z'
      }]

      const riverId = 'testRiverId'
      const result = riverViewModel(riverId, stations, 'river')

      expect(result.stations[0].displayData).toBe(true)
    })

    it('should set "displayData" to false for suspended Welsh stations', async () => {
      const stations = [{
        status: 'Suspended',
        value: 1.2,
        value_erred: false,
        iswales: true,
        lon: 0,
        lat: 0,
        external_name: 'Test Station',
        station_type: 'R',
        river_qualified_name: 'Test River',
        trend: 'steady',
        percentile_5: '1.0',
        percentile_95: '0.5',
        value_timestamp: '2022-03-30T12:00:00Z'
      }]

      const riverId = 'testRiverId'
      const result = riverViewModel(riverId, stations, 'river')

      expect(result.stations[0].displayData).toBe(false)
    })

    it('should set "displayData" to false for closed Welsh stations', async () => {
      const stations = [{
        status: 'Closed',
        value: 1.2,
        value_erred: false,
        iswales: true,
        lon: 0,
        lat: 0,
        external_name: 'Test Station',
        station_type: 'R',
        river_qualified_name: 'Test River',
        trend: 'steady',
        percentile_5: '1.0',
        percentile_95: '0.5',
        value_timestamp: '2022-03-30T12:00:00Z'
      }]

      const riverId = 'testRiverId'
      const result = riverViewModel(riverId, stations, 'river')

      expect(result.stations[0].displayData).toBe(false)
    })
  })
})
