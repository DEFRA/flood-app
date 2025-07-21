'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const ViewModel = require('../../server/models/views/alerts-and-warnings')
const data = require('../data')
const Floods = require('../../server/models/floods')

describe('Model - Alerts and Warnings', () => {
  it('should return no exposed placeBbox data if the place is not in England', () => {
    let station, location

    const place = data.scottishPlaceData
    const floods = new Floods({ floods: data.floodAlertStation })

    const Result = new ViewModel({ location, place, floods, station })

    expect(Result.expose.placeBbox.length).to.equal(0)
    expect(Result.pageTitle).to.equal('Kinghorn - flood alerts and warnings')
  })

  it('should return the correct number of floods', () => {
    let place, location

    const station = data.alertStation
    const floods = new Floods({ floods: data.floodAlertStation })

    const Result = new ViewModel({ location, place, floods, station })

    expect(Result.countFloods).to.equal(6)
  })

  it('should return an error if the "error" property is set', () => {
    let place, location

    const station = data.alertStation
    const floods = new Floods({ floods: data.floodAlertStation })
    const error = true

    const Result = new ViewModel({ location, place, floods, station, error })

    expect(Result.pageTitle).to.equal('Sorry, there is currently a problem searching a location')
  })

  it('should have the location in the page title', () => {
    let station, place, floods

    const location = 'Newcastle Upon Tyne'
    const Result = new ViewModel({ location, place, floods, station })

    expect(Result.pageTitle).to.equal('Newcastle Upon Tyne - flood alerts and warnings')
  })

  it('should set "displayGetWarningsLink" with the appropriate value', () => {
    const options = {}

    const Result = new ViewModel(options)

    expect(Result.displayGetWarningsLink, 'Get warnings flag should be true').to.equal(true)
    expect(Result.displayLongTermLink, 'Long term flood risk flag should be true').to.equal(true)
  })
})
