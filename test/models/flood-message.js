'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = (exports.lab = Lab.script())
const { getSevereWarnings, displayGetWarningsLink } = require('../../server/models/floods-message')

describe('Model - Flood Message', () => {
  describe('getSevereWarnings', () => {
    it('should return "one severe flood warning" for a single severe warning', () => {
      expect(getSevereWarnings(1)).to.equal('one severe flood warning')
    })

    it('should return "0 severe flood warnings" for zero severe warnings', () => {
      expect(getSevereWarnings(0)).to.equal('0 severe flood warning')
    })

    it('should return "{n} severe flood warnings" for multiple severe warnings', () => {
      expect(getSevereWarnings(3)).to.equal('3 severe flood warnings')
    })
  })

  describe('displayGetWarningsLink', () => {
    it('should return "one flood warning" for a single warning', () => {
      expect(displayGetWarningsLink(1)).to.equal('one flood warning')
    })

    it('should return "0 flood warnings" for zero warnings', () => {
      expect(displayGetWarningsLink(0)).to.equal('0 flood warning')
    })

    it('should return "{n} flood warnings" for multiple warnings', () => {
      expect(displayGetWarningsLink(2)).to.equal('2 flood warnings')
    })
  })
})
