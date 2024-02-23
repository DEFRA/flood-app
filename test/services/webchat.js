const sinon = require('sinon')
const Code = require('@hapi/code')
const lab = exports.lab = require('@hapi/lab').script()

// Import the module under test
const webchatService = require('../../server/services/webchat')

lab.experiment('Check webchat service', () => {
  let sandbox

  lab.beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  lab.afterEach(() => {
    sandbox.restore()
  })

  lab.test('Check webchat service exists', () => {
    // Ensure that the webchatService object is an object
    Code.expect(webchatService).to.be.an.object()
  })

  // lab.test('Test getAvailability endpoint', async () => {
  //   const mockAvailability = 'available'

  //   // Stub the function directly
  //   sandbox.stub(require('@defra/flood-webchat'), 'getAvailability').resolves(mockAvailability)

  //   const result = await webchatService.getAvailability()
  //   Code.expect(result).to.equal(mockAvailability)
  // })
})
