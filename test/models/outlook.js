'use strict'

const Lab = require('@hapi/lab')
const Code = require('code')
const lab = exports.lab = Lab.script()
const Outlook = require('../../server/models/outlook')

lab.experiment('Outlook model test', () => {
  lab.test('Check outlook model exists', () => {
    Code.expect(Outlook).to.be.a.function()
  })
})
