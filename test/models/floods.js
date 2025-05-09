'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const lab = exports.lab = Lab.script()
const Floods = require('../../server/models/floods')

lab.experiment('Model - Floods', () => {
  lab.test('should check "Floods" model exists', () => {
    expect(Floods).to.be.a.function()
  })
})
