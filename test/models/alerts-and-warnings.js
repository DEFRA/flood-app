'use strict'

const ViewModel = require('../../server/models/views/alerts-and-warnings')
const data = require('../data')
const Floods = require('../../server/models/floods')

describe('Model - Alerts and Warnings', () => {
  it('should return no exposed placeBbox data if the place is not in England', () => {
    let station, location

    const place = data.scottishPlaceData
    const floods = new Floods({ floods: data.floodAlertStation })

    const Result = new ViewModel({ location, place, floods, station })

    expect(Result.expose.placeBbox.length).toBe(0)
    expect(Result.pageTitle).toBe('Kinghorn - flood alerts and warnings')
  })

  it('should return the correct number of floods', () => {
    let place, location

    const station = data.alertStation
    const floods = new Floods({ floods: data.floodAlertStation })

    const Result = new ViewModel({ location, place, floods, station })

    expect(Result.countFloods).toBe(6)
  })

  it('should return an error if the "error" property is set', () => {
    let place, location

    const station = data.alertStation
    const floods = new Floods({ floods: data.floodAlertStation })
    const error = true

    const Result = new ViewModel({ location, place, floods, station, error })

    expect(Result.pageTitle).toBe('Sorry, there is currently a problem searching a location')
  })

  it('should have the location in the page title', () => {
    let station, place, floods

    const location = 'Newcastle Upon Tyne'
    const Result = new ViewModel({ location, place, floods, station })

    expect(Result.pageTitle).toBe('Newcastle Upon Tyne - flood alerts and warnings')
  })

  it('should set "displayGetWarningsLink" with the appropriate value', () => {
    const options = {}

    const Result = new ViewModel(options)

    expect(Result.displayGetWarningsLink).toBe(true)
    expect(Result.displayLongTermLink).toBe(true)
  })
})
