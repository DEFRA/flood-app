'use strict'

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
      const ViewModel = require('../../server/models/views/target-area')

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

      expect(viewModel).toMatchObject({
        metaDescription: 'Flooding information and advice for the area: A description.',
        metaCanonical: '/target-area/ABCDW001',
        pageTitle: 'Flood warning for TA #1'
      })
    })

    it('should remove spaces and terminate description with a single full stop', () => {
      const ViewModel = require('../../server/models/views/target-area')

      const targetAreaValues = {
        code: 'ABCDW001',
        description: 'A description.  '
      }

      const floodWarningValues = {}

      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)

      const viewModel = new ViewModel(options)

      expect(viewModel).toMatchObject({
        areaDescription: 'Flood warning area: A description.'
      })
    })

    it('should add a full stop to the end of the description when one is not present', () => {
      const ViewModel = require('../../server/models/views/target-area')

      const targetAreaValues = {
        code: 'ABCDW001',
        description: 'A description'
      }

      const floodWarningValues = {}

      const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)

      const viewModel = new ViewModel(options)

      expect(viewModel).toMatchObject({
        areaDescription: 'Flood warning area: A description.'
      })
    })
  })

  describe('parentTargetArea', () => {
    const ViewModel = require('../../server/models/views/target-area')

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

      expect(viewModel).toBeDefined()
      expect(viewModel).toBeInstanceOf(ViewModel)
      expect(viewModel).toMatchObject({ parentAreaAlert: false })
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

      expect(viewModel).toBeDefined()
      expect(viewModel).toBeInstanceOf(ViewModel)
      expect(viewModel).toMatchObject({ parentAreaAlert: false })
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

      expect(viewModel).toBeDefined()
      expect(viewModel).toBeInstanceOf(ViewModel)
      expect(viewModel).toMatchObject({ parentAreaAlert: true })
    })
  })

  describe('CYLTFR options', () => {
    const configValues = {
      floodRiskUrl: 'http://cyltfr.org.uk'
    }

    let ViewModel
    jest.isolateModules(() => {
      jest.doMock('../../server/config', () => ({
        ...jest.requireActual('../../server/config'),
        ...configValues
      }))
      ViewModel = require('../../server/models/views/target-area')
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
      expect(viewModel).toBeDefined()
      expect(viewModel).toBeInstanceOf(ViewModel)
      expect(viewModel).toMatchObject({
        // TODO: add further included values
        placeName: 'Riverside View, Newtown'
      })
    })

    it('should return CYLTFR link values', () => {
      expect(viewModel).toMatchObject({
        displayLongTermLink: true,
        floodRiskUrl: 'http://cyltfr.org.uk'
      })
    })
  })

  describe('severity level', () => {
    const ViewModel = require('../../server/models/views/target-area')

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

      expect(viewModel.severity).toMatchObject({ title: 'Flood warning' })
      expect(viewModel).toMatchObject({ pageTitle: 'Flood warning for Riverside View, Newtown' })
    })
  })

  describe('situation Changed', () => {
    it('should populate the situation changed from the flood warning details', () => {
      const ViewModel = require('../../server/models/views/target-area')

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

      expect(viewModel).toMatchObject({ situationChanged: 'Updated 7:23pm on 5 August 2020' })
    })

    it('should populate the situation changed with an "updated" message if flood warning no longer exists', () => {
      const ViewModel = require('../../server/models/views/target-area')
      const fixedTime = moment.tz('2022-09-15T16:13:00.000Z', 'Europe/London')
      jest.spyOn(moment, 'tz').mockReturnValue(fixedTime)

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

      expect(viewModel).toMatchObject({ situationChanged: 'Up to date as of 5:13pm on 15 September 2022' })
    })

    it('should populate the situation changed with a "removed" message if flood warning removed', () => {
      const ViewModel = require('../../server/models/views/target-area')
      const fixedTime = moment.tz('2022-09-15T16:13:00.000Z', 'Europe/London')
      jest.spyOn(moment, 'tz').mockReturnValue(fixedTime)

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

      expect(viewModel).toMatchObject({ situationChanged: 'Removed 5:13pm on 15 September 2022' })
    })

    // it('should revert to fallbackText when Warning situation string is blank', async () => {
    //   const ViewModel = require('../../server/models/views/target-area')

    //   const targetAreaValues = {
    //     code: 'ABCDW001'
    //   }

    //   const floodWarningValues = {
    //     situation: ''
    //   }

    //   const options = getTargetAreaAndWarning(targetAreaValues, floodWarningValues)

    //   const viewModel = new ViewModel(options)

    //   expect(viewModel).toMatchObject({
    //     situation: '<p>We\'ll update this page when there\'s a flood warning in the area.</p><p>A flood warning means flooding to some property is expected. A severe flood warning means there\'s a danger to life.</p>'
    //   })
    // })

    // it('should revert to fallbackText when Alert situation string is blank', async () => {
    //   const ViewModel = require('../../server/models/views/target-area')

    //   const targetAreaValues = {
    //     code: 'ABCDA001'
    //   }

    //   const floodAlertValues = {
    //     situation: ''
    //   }

    //   const options = getTargetAreaAndAlert(targetAreaValues, floodAlertValues)

    //   const viewModel = new ViewModel(options)

    //   expect(viewModel).toMatchObject({
    //     situation: '<p>We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.</p>'
    //   })
    // })
  })
})
