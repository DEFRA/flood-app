'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const Floods = require('../../server/models/floods')

describe('Model - Floods', () => {
  it('should check "Floods" model exists', () => {
    expect(Floods).to.be.a.function()
  })
})
