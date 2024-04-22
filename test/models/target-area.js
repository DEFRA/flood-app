'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const fakeTargetAreaFloodData = require('../data/fakeTargetAreaFloodData.json')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const moment = require('moment-timezone')

describe('target area model test', () => {
  describe('CYLTFR options', () => {
    const configValues = {
      floodRiskUrl: 'http://cyltfr.org.uk'
    }
    const ViewModel = proxyquire('../../server/models/views/target-area', {
      '../../../server/config': configValues
    })
    const options = {
      area: fakeTargetAreaFloodData.area,
      flood: fakeTargetAreaFloodData.floods[0]
    }
    const viewModel = new ViewModel(options)
    it('should return return a populated model class', async () => {
      expect(viewModel).to.not.be.undefined()
      expect(viewModel).to.be.an.instanceof(ViewModel)
      expect(viewModel).to.include({
        // TODO: add further included values
        placeName: 'Upper River Derwent, Stonethwaite Beck and Derwent Water'
      })
    })
    it('should return CYLTFR link values', async () => {
      expect(viewModel).to.include({
        displayLongTermLink: true,
        floodRiskUrl: 'http://cyltfr.org.uk'
      })
    })
  })
  describe('Severity level', () => {
    const ViewModel = proxyquire('../../server/models/views/target-area', {})
    it('should populate the severity level details from the warning', async () => {
      const options = {
        area: fakeTargetAreaFloodData.area,
        flood: fakeTargetAreaFloodData.floods[0]
      }
      const viewModel = new ViewModel(options)
      expect(viewModel.severity).to.include({
        title: 'Flood alert'
      })
      expect(viewModel).to.include({
        pageTitle: 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water'
      })
    })
  })
  describe('Situation Changed', () => {
    it('should populate the situation changed from the flood warning details', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {})
      const options = {
        area: fakeTargetAreaFloodData.area,
        flood: fakeTargetAreaFloodData.floods[0]
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        situationChanged: 'Updated 7:23pm on 5 August 2020'
      })
    })
    it('??? should populate the situation changed details from the current date/time when no date in flood warning details', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {
        'moment-timezone': {
          tz: sinon.stub().returns(moment.tz('2022-09-15T16:13:00.000Z', 'Europe/London'))
        }
      })
      const { situation_changed: _, ...undatedFlood } = fakeTargetAreaFloodData.floods[0]
      const options = {
        area: fakeTargetAreaFloodData.area,
        flood: undatedFlood
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        situationChanged: 'Updated 5:13pm on 15 September 2022'
      })
    })
    it('should populate the situation changed with an "updated" message if flood warning no longer exists', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {
        'moment-timezone': {
          tz: sinon.stub().returns(moment.tz('2022-09-15T16:13:00.000Z', 'Europe/London'))
        }
      })
      const options = {
        area: fakeTargetAreaFloodData.area,
        flood: undefined
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        situationChanged: 'Up to date as of 5:13pm on 15 September 2022'
      })
    })
    it('should populate the situation changed with a "removed" message if flood warning removed', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {
        'moment-timezone': {
          tz: sinon.stub().returns(moment.tz('2022-09-15T16:13:00.000Z', 'Europe/London'))
        }
      })
      const flood = { ...fakeTargetAreaFloodData.floods[0] }
      flood.severity_value = 4
      const options = {
        area: fakeTargetAreaFloodData.area,
        flood
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        situationChanged: 'Removed 5:13pm on 15 September 2022'
      })
    })
  })
})
