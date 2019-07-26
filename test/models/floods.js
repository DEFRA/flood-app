'use strict'

const Lab = require('@hapi/lab')
const Code = require('code')
const lab = exports.lab = Lab.script()
const Floods = require('../../server/models/floods')

lab.experiment('Floods model test', () => {
  lab.test('Check floods model exists', () => {
    Code.expect(Floods).to.be.a.function()
  })
})
