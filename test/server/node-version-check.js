'use strict'

const Lab = require('@hapi/lab')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()

describe('Node Version Check', () => {
  let mockSemver
  let nodeVersionCheck
  let originalProcessVersion
  const testNodeVersion = 'v20.18.2'

  beforeEach(() => {
    originalProcessVersion = process.version

    Object.defineProperty(process, 'version', {
      value: testNodeVersion,
      configurable: true
    })

    mockSemver = {
      satisfies: Sinon.stub()
    }

    nodeVersionCheck = Proxyquire('../../server/lib/node-version-check', {
      semver: mockSemver
    })
  })

  afterEach(() => {
    Object.defineProperty(process, 'version', {
      value: originalProcessVersion,
      configurable: true
    })
  })

  describe('nodeVersionCheck', () => {
    it('should not throw when no version requirement is provided', () => {
      expect(() => nodeVersionCheck()).to.not.throw()
      expect(() => nodeVersionCheck(null)).to.not.throw()
      expect(() => nodeVersionCheck(undefined)).to.not.throw()

      expect(mockSemver.satisfies.called).to.be.false()
    })

    it('should not throw when node version satisfies requirement', () => {
      mockSemver.satisfies.returns(true)
      const requiredVersion = '20.x'

      expect(() => nodeVersionCheck(requiredVersion)).to.not.throw()

      expect(mockSemver.satisfies.calledOnceWith(testNodeVersion, requiredVersion)).to.be.true()
    })

    it('should throw when node version does not satisfy requirement', () => {
      mockSemver.satisfies.returns(false)
      const requiredVersion = '21.x'

      expect(() => nodeVersionCheck(requiredVersion)).to.throw(Error)

      expect(mockSemver.satisfies.calledOnceWith(testNodeVersion, requiredVersion)).to.be.true()
    })

    it('should include version information in error message', () => {
      mockSemver.satisfies.returns(false)
      const requiredVersion = '21.x'

      const error = expect(() => nodeVersionCheck(requiredVersion)).to.throw(Error)
      expect(error.message).to.equal('Node.js version v20.18.2 does not satisfy the required version 21.x')

      expect(mockSemver.satisfies.calledOnceWith(testNodeVersion, requiredVersion)).to.be.true()
    })
  })
})
