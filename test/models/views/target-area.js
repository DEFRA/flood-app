'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const ViewModel = require('../../../server/models/views/target-area')
const targetAreaAlert = require('../../data/targetAreaAlert.json')

lab.experiment('Test target Area View Model', () => {
  lab.test('Test returns situation text with twitter link correctly when situation ends in full-stop', async () => {
    // Arrange
    const options = {
      ...targetAreaAlert,
      flood: {
        ...targetAreaAlert.flood,
        situation: 'Example situation with full stop. '
      }
    }

    // Act
    const Result = await new ViewModel(options)

    // Assert
    Code.expect(Result.situation).to.startWith('<p>Example situation with full stop. Follow ')
  })

  lab.test('Test returns situation text with twitter link correctly when situation doesn\'t end in full-stop', async () => {
    // Arrange
    const options = {
      ...targetAreaAlert,
      flood: {
        ...targetAreaAlert.flood,
        situation: 'Example situation without full stop'
      }
    }

    // Act
    const Result = await new ViewModel(options)

    // Assert
    Code.expect(Result.situation).to.startWith('<p>Example situation without full stop. Follow ')
  })
})
