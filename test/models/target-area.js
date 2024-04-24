'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const moment = require('moment-timezone')
const {
  getAlert,
  getWarning,
  getRemoved,
  getTargetArea
} = require('../lib/helpers/data-builders')

function getTargetAreaAndWarning (targetAreaValues, floodWarningValues) {
  const area = getTargetArea(targetAreaValues)
  const floodWarning = getWarning(floodWarningValues)
  return { area, flood: floodWarning }
}

describe('target area model test', () => {
  describe('Description handling', () => {
    it('should populate meta details', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {})
      const targetAreaValues = {
        code: 'ABCDW001',
        name: 'TA #1',
        description: 'A description.'
      }
      const floodWarningValues = {
        ta_code: 'ABCDW001'
      }
      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        metaDescription: 'Flooding information and advice for the area: A description.',
        metaCanonical: '/target-area/ABCDW001',
        pageTitle: 'Flood warning for TA #1'
      })
    })
    it('should remove spaces and terminate description with a single full stop', async () => {
      // note: although this is functionally the same as
      // require('../../server/models/views/target-area')
      // choose to use this as proxyquire doesn't cache unlike require
      // and therefore we don't need to flush the require cache
      const ViewModel = proxyquire('../../server/models/views/target-area', {})
      const targetAreaValues = {
        code: 'ABCDW001',
        description: 'A description.  '
      }
      const floodWarningValues = {}
      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        areaDescription: 'Flood warning area: A description.'
      })
    })
    it('should add a full stop to the end of the description when one is not present', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {})
      const targetAreaValues = {
        code: 'ABCDW001',
        description: 'A description'
      }
      const floodWarningValues = {}
      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        areaDescription: 'Flood warning area: A description.'
      })
    })
  })
  describe('parentTargetArea assignment', () => {
    const ViewModel = proxyquire('../../server/models/views/target-area', {})
    it('parentAreaAlert should be false when no parent TA exists', async () => {
      const targetAreaValues = {
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCW001',
        description: 'Description for Riverside View, Newtown',
        parent: 'XYZA001'
      }
      const floodWarningValues = {
        ta_id: 1,
        ta_name: 'Riverside View, Newtown',
        ta_code: 'ABCW001',
        ta_description: 'Description for Riverside View, Newtown'
      }
      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)
      const viewModel = new ViewModel(options)
      expect(viewModel).to.not.be.undefined()
      expect(viewModel).to.be.an.instanceof(ViewModel)
      expect(viewModel).to.include({
        parentAreaAlert: false
      })
    })
    it('parentAreaAlert should be false when severity of warning for the child TA  is not "removed" even if a parent TA exists', async () => {
      const area = getTargetArea({
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCW001',
        description: 'Description for Riverside View, Newtown',
        parent: 'XYZA001'
      })
      const floodWarning = getWarning({
        ta_id: 1,
        ta_name: 'Riverside View, Newtown',
        ta_code: 'ABCW001',
        ta_description: 'Description for Riverside View, Newtown'
      })
      const parentFloodAlert = getAlert({
        ta_id: 2,
        ta_name: 'Seaside View, Newtown',
        ta_code: 'XYZA001',
        ta_description: 'Description for Seaside View, Newtown'
      })

      const options = {
        area,
        flood: floodWarning,
        parentFlood: parentFloodAlert
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.not.be.undefined()
      expect(viewModel).to.be.an.instanceof(ViewModel)
      expect(viewModel).to.include({
        parentAreaAlert: false
      })
    })
    it('parentAreaAlert should be true when severity of warning for the child TA is "removed" and the warning for the parent TA is active', async () => {
      const area = getTargetArea({
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCDW001',
        description: 'Description for Riverside View, Newtown',
        parent: 'XYZA001'
      })
      const floodWarning = getRemoved({
        ta_id: 1,
        ta_name: 'Riverside View, Newtown',
        ta_code: 'ABCDW001',
        ta_description: 'Description for Riverside View, Newtown'
      })
      const parentFloodAlert = getAlert({
        ta_id: 2,
        ta_name: 'Seaside View, Newtown',
        ta_code: 'WXYZA001',
        ta_description: 'Description for Seaside View, Newtown'
      })

      const options = {
        area,
        flood: floodWarning,
        parentFlood: parentFloodAlert
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.not.be.undefined()
      expect(viewModel).to.be.an.instanceof(ViewModel)
      expect(viewModel).to.include({
        parentAreaAlert: true
      })
    })
  })
  describe('CYLTFR options', () => {
    const configValues = {
      floodRiskUrl: 'http://cyltfr.org.uk'
    }
    const ViewModel = proxyquire('../../server/models/views/target-area', {
      '../../../server/config': configValues
    })
    const targetAreaValues = {
      id: 1,
      area: 'Riverton',
      name: 'Riverside View, Newtown',
      code: 'ABCW001',
      description: 'Description for Riverside View, Newtown',
      parent: 'XYZA001'
    }
    const floodWarningValues = {
      ta_id: 1,
      ta_name: 'Riverside View, Newtown',
      ta_code: 'ABCW001',
      ta_description: 'Description for Riverside View, Newtown'
    }
    const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)

    const viewModel = new ViewModel(options)
    it('should return return a populated model class', async () => {
      expect(viewModel).to.not.be.undefined()
      expect(viewModel).to.be.an.instanceof(ViewModel)
      expect(viewModel).to.include({
        // TODO: add further included values
        placeName: 'Riverside View, Newtown'
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
      const targetAreaValues = {
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCW001',
        description: 'Description for Riverside View, Newtown',
        parent: 'XYZA001'
      }
      const floodWarningValues = {
        ta_id: 1,
        ta_name: 'Riverside View, Newtown',
        ta_code: 'ABCW001',
        ta_description: 'Description for Riverside View, Newtown'
      }
      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)
      const viewModel = new ViewModel(options)
      expect(viewModel.severity).to.include({
        title: 'Flood warning'
      })
      expect(viewModel).to.include({
        pageTitle: 'Flood warning for Riverside View, Newtown'
      })
    })
  })
  describe('Situation Changed', () => {
    it('should populate the situation changed from the flood warning details', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {})
      const targetAreaValues = {
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCW001',
        description: 'Description for Riverside View, Newtown'
      }
      const floodWarningValues = {
        ta_id: 1,
        ta_name: 'Riverside View, Newtown',
        ta_code: 'ABCW001',
        ta_description: 'Description for Riverside View, Newtown',
        situation_changed: '2020-08-05T18:23:00.000Z'
      }
      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        situationChanged: 'Updated 7:23pm on 5 August 2020'
      })
    })
    it('should populate the situation changed with an "updated" message if flood warning no longer exists', async () => {
      const ViewModel = proxyquire('../../server/models/views/target-area', {
        'moment-timezone': {
          tz: sinon.stub().returns(moment.tz('2022-09-15T16:13:00.000Z', 'Europe/London'))
        }
      })
      const area = getTargetArea({
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCW001',
        description: 'Description for Riverside View, Newtown',
        parent: 'XYZA001'
      })
      const options = {
        area
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
      const area = getTargetArea({
        id: 1,
        area: 'Riverton',
        name: 'Riverside View, Newtown',
        code: 'ABCW001',
        description: 'Description for Riverside View, Newtown',
        parent: 'XYZA001'
      })
      const floodWarning = getRemoved({
        ta_id: 1,
        ta_name: 'Riverside View, Newtown',
        ta_code: 'ABCDW001',
        ta_description: 'Description for Riverside View, Newtown'
      })
      const options = {
        area,
        flood: floodWarning
      }
      const viewModel = new ViewModel(options)
      expect(viewModel).to.include({
        situationChanged: 'Removed 5:13pm on 15 September 2022'
      })
    })
  })
})
