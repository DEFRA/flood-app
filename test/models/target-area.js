'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const fakeTargetAreaFloodData = require('../data/fakeTargetAreaFloodData.json')
const proxyquire = require('proxyquire')

const ViewModel = proxyquire('../../server/models/views/target-area', {
  '../../../server/config': {
    floodRiskUrl: 'http://cyltfr.org.uk',
    bingKeyMaps: 'bing-key'
  }
})

describe('target area model test', () => {
  describe('CYLTFR options', () => {
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
})
