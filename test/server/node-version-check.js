'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')

const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

describe('Node Version Check', () => {
  let mockSemver
  let consoleErrorStub
  let processExitStub
  let nodeVersionCheck
  let originalProcessVersion
  const testNodeVersion = 'v20.18.2'

  beforeEach(() => {
    originalProcessVersion = process.version

    // need to do this rather than just process.version = '1.1.1' as the
    // property is reaad only
    Object.defineProperty(process, 'version', {
      value: testNodeVersion,
      configurable: true
    })

    consoleErrorStub = Sinon.stub(console, 'error')

    mockSemver = {
      satisfies: Sinon.stub()
    }

    processExitStub = Sinon.stub(process, 'exit')

    nodeVersionCheck = Proxyquire('../../server/lib/node-version-check', {
      semver: mockSemver
    })
  })

  afterEach(() => {
    Object.defineProperty(process, 'version', {
      value: originalProcessVersion,
      configurable: true
    })

    processExitStub.restore()
    consoleErrorStub.restore()
  })

  describe('nodeVersionCheck', () => {
    it('should not exit when no version requirement is provided', () => {
      nodeVersionCheck()
      nodeVersionCheck(null)
      nodeVersionCheck(undefined)

      expect(mockSemver.satisfies.called).to.be.false()
      expect(processExitStub.called).to.be.false()
    })

    it('should not exit when node version satisfies requirement', () => {
      mockSemver.satisfies.returns(true)
      const requiredVersion = '20.x'

      nodeVersionCheck(requiredVersion)

      expect(mockSemver.satisfies.calledOnceWith(testNodeVersion, requiredVersion)).to.be.true()
      expect(processExitStub.called).to.be.false()
    })

    it('should exit with code 1 when node version does not satisfy requirement', () => {
      mockSemver.satisfies.returns(false)
      const requiredVersion = '21.x'

      nodeVersionCheck(requiredVersion)

      expect(mockSemver.satisfies.calledOnceWith(testNodeVersion, requiredVersion)).to.be.true()
      expect(processExitStub.calledOnceWith(1)).to.be.true()
    })

    it('should log error message with version information when check fails', () => {
      mockSemver.satisfies.returns(false)
      const requiredVersion = '21.x'

      nodeVersionCheck(requiredVersion)

      expect(consoleErrorStub.calledOnce).to.be.true()
      const expectedMessage = `Error: Node.js version ${testNodeVersion} does not satisfy the required version ${requiredVersion}`
      expect(consoleErrorStub.firstCall.args[0]).to.equal(expectedMessage)
    })
  })
})
