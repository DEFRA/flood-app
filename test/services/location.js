'use strict'

const Lab = require('@hapi/lab')
const Code = require('code')
const lab = exports.lab = Lab.script()
const Floods = require('../../server/services/location')

lab.experiment('location service test', () => {
  lab.test('Check location service exists', () => {
    Code.expect(Floods).to.be.a.object()
  })
})
