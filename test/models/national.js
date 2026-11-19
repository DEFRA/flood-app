'use strict'

const ViewModel = require('../../server/models/views/national')

describe('Model - National', () => {
  const groups = [1, 2, 3, 4].map(name => ({ name, count: 0, description: '', severity: {}, title: '' }))
  const floods = { hasActiveFloods: false, highestSeverityId: 0, _groups: groups, groups, isDummyData: false }

  it('should flag a data error when no outlook is provided', () => {
    const viewModel = new ViewModel(floods, undefined, 'England')

    expect(viewModel.dataError).toBeTrue()
    expect(viewModel.outlookOutOfDate).toBeFalse()
    expect(viewModel.outlook.days).toBeUndefined()
  })
})
