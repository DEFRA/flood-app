'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const ViewModel = require('../../server/models/views/alerts-and-warnings')
const data = require('../data')
const Floods = require('../../server/models/floods')

lab.test('Test alerts and warnings viewModel with a station', async () => {
  let place, location
  const station = data.alertStation
  const floods = new Floods({ floods: data.floodAlertStation })

  const Result = await new ViewModel({ location, place, floods, station })

  Code.expect(Result.pageTitle).to.equal('Davis Road - flood alerts and warnings')
  Code.expect(Result.map).to.equal('map-station')
  Code.expect(Result.station.rloi_id).to.equal(5041)
})

lab.test('Test exposed data placeBox is blank if not a place in England', async () => {
  let station, location
  const place = data.scottishPlaceData
  const floods = new Floods({ floods: data.floodAlertStation })

  const Result = await new ViewModel({ location, place, floods, station })

  Code.expect(Result.expose.placeBbox.length).to.equal(0)
  Code.expect(Result.pageTitle).to.equal('Flood alerts and warnings')
})

lab.test('Test count floods function returns correct number of floods', async () => {
  let place, location
  const station = data.alertStation
  const floods = new Floods({ floods: data.floodAlertStation })

  const Result = await new ViewModel({ location, place, floods, station })

  Code.expect(Result.countFloods).to.equal(6)
})

lab.test('Test error returns error', async () => {
  let place, location
  const station = data.alertStation
  const floods = new Floods({ floods: data.floodAlertStation })
  const error = true

  const Result = await new ViewModel({ location, place, floods, station, error })

  Code.expect(Result.pageTitle).to.equal('Sorry, there is currently a problem searching a location')
})

lab.test('Test location sets page title', async () => {
  let station, place, floods

  const location = 'Newcastle Upon Tyne'
  const Result = await new ViewModel({ location, place, floods, station })

  Code.expect(Result.pageTitle).to.equal('Newcastle Upon Tyne - flood alerts and warnings')
})

lab.test('Test getWarnings has appropriate Value', async () => {
  const options = {}

  const Result = await new ViewModel(options)

  Code.expect(Result.getWarnings, 'Get warnings flag should be true').to.equal(true)
  Code.expect(Result.longTerm, 'Long term flood risk flag should be true').to.equal(true)
})
