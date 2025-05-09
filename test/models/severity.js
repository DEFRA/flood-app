'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const Floods = require('../../server/models/severity')

lab.experiment('Model - Severity', () => {
  lab.test('should return Severity model', () => {
    expect(Floods).to.be.an.array()
  })
})
