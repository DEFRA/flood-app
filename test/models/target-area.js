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

// function getTargetAreaAndAlert (targetAreaValues, floodAlertValues) {
//   const area = getTargetArea(targetAreaValues)
//   const floodAlert = getAlert(floodAlertValues)
//   return { area, flood: floodAlert }
// }

describe('Model - Target Area', () => {
  describe('metadata', () => {
    it('should populate meta details', () => {
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

    it('should remove spaces and terminate description with a single full stop', () => {
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

    it('should add a full stop to the end of the description when one is not present', () => {
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

  describe('parentTargetArea', () => {
    const ViewModel = proxyquire('../../server/models/views/target-area', {})

    it('should set "parentAreaAlert" to false when no parent TA exists', () => {
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
      expect(viewModel).to.include({ parentAreaAlert: false })
    })

    it('should set "parentAreaAlert" to false when severity of warning for the child TA  is not "removed" even if a parent TA exists', () => {
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
      expect(viewModel).to.include({ parentAreaAlert: false })
    })

    it('should set "parentAreaAlert" to true when severity of warning for the child TA is "removed" and the warning for the parent TA is active', () => {
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
      expect(viewModel).to.include({ parentAreaAlert: true })
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

    it('should return return a populated model class', () => {
      expect(viewModel).to.not.be.undefined()
      expect(viewModel).to.be.an.instanceof(ViewModel)
      expect(viewModel).to.include({
        // TODO: add further included values
        placeName: 'Riverside View, Newtown'
      })
    })

    it('should return CYLTFR link values', () => {
      expect(viewModel).to.include({
        displayLongTermLink: true,
        floodRiskUrl: 'http://cyltfr.org.uk'
      })
    })
  })

  describe('severity level', () => {
    const ViewModel = proxyquire('../../server/models/views/target-area', {})

    it('should populate the severity level details from the warning', () => {
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

      expect(viewModel.severity).to.include({ title: 'Flood warning' })
      expect(viewModel).to.include({ pageTitle: 'Flood warning for Riverside View, Newtown' })
    })
  })

  describe('situation Changed', () => {
    it('should populate the situation changed from the flood warning details', () => {
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

      expect(viewModel).to.include({ situationChanged: 'Updated 7:23pm on 5 August 2020' })
    })

    it('should populate the situation changed with an "updated" message if flood warning no longer exists', () => {
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

      expect(viewModel).to.include({ situationChanged: 'Up to date as of 5:13pm on 15 September 2022' })
    })

    it('should populate the situation changed with a "removed" message if flood warning removed', () => {
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

      expect(viewModel).to.include({ situationChanged: 'Removed 5:13pm on 15 September 2022' })
    })

    // it('should revert to fallbackText when Warning situation string is blank', async () => {
    //   const ViewModel = proxyquire('../../server/models/views/target-area', {})

    //   const targetAreaValues = {
    //     code: 'ABCDW001'
    //   }

    //   const floodWarningValues = {
    //     situation: ''
    //   }

    //   const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)

    //   const viewModel = new ViewModel(options)

    //   expect(viewModel).to.include({
    //     situation: '<p>We\'ll update this page when there\'s a flood warning in the area.</p><p>A flood warning means flooding to some property is expected. A severe flood warning means there\'s a danger to life.</p>'
    //   })
    // })

    // it('should revert to fallbackText when Alert situation string is blank', async () => {
    //   const ViewModel = proxyquire('../../server/models/views/target-area', {})

    //   const targetAreaValues = {
    //     code: 'ABCDA001'
    //   }

    //   const floodAlertValues = {
    //     situation: ''
    //   }

    //   const options = getTargetAreaAndAlert(targetAreaValues, floodAlertValues)

    //   const viewModel = new ViewModel(options)

    //   expect(viewModel).to.include({
    //     situation: '<p>We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.</p>'
    //   })
    // })
  })
})
