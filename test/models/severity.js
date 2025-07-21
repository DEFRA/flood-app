'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()
const Floods = require('../../server/models/severity')

describe('Model - Severity', () => {
  it('should return Severity model', () => {
    expect(Floods).to.be.an.array()
  })
})
