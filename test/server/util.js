const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')
const lab = exports.lab = Lab.script()
const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { toMarked, cleanseLocation, removeSpikes } = require('../../server/util')

lab.experiment('util', () => {
  lab.experiment('get', () => {
    let wreckStub
    let util

    lab.beforeEach(() => {
      // Create a stub for wreck methods
      wreckStub = {
        get: Sinon.stub(),
        post: Sinon.stub(),
        defaults: () => wreckStub
      }

      // Use proxyquire to replace the wreck module in util.js
      util = Proxyquire('../../server/util', {
        '@hapi/wreck': wreckStub
      })
    })

    lab.afterEach(() => {
      Sinon.restore()
    })

    lab.experiment('happy path', () => {
      lab.test('should successfully get data from a URL', async () => {
        // Mock successful response
        const mockPayload = { data: 'test data' }
        wreckStub.get.resolves({
          res: { statusCode: 200, headers: {} },
          payload: mockPayload
        })

        const result = await util.get('https://example.com/api', { option: 'value' })

        Code.expect(result).to.equal(mockPayload)
        Code.expect(wreckStub.get.calledOnce).to.be.true()
        Code.expect(wreckStub.get.firstCall.args[0]).to.equal('https://example.com/api')
        Code.expect(wreckStub.get.firstCall.args[1]).to.equal({ option: 'value' })
      })

      lab.test('should handle JSON responses with getJson', async () => {
        // Mock successful JSON response
        const mockPayload = { data: 'test data' }
        wreckStub.get.resolves({
          res: { statusCode: 200, headers: {} },
          payload: mockPayload
        })

        const result = await util.getJson('https://example.com/api')

        Code.expect(result).to.equal(mockPayload)
        Code.expect(wreckStub.get.calledOnce).to.be.true()
        Code.expect(wreckStub.get.firstCall.args[0]).to.equal('https://example.com/api')
        Code.expect(wreckStub.get.firstCall.args[1]).to.equal({ json: true })
      })
    })

    lab.experiment('sad path', () => {
      lab.test('should throw error when response status code is not 200', async () => {
        // Create an error with a message property that can be matched as a string
        const errorPayload = new Error('Not Found')

        // Mock error response
        wreckStub.get.resolves({
          res: { statusCode: 404, headers: {} },
          payload: errorPayload
        })

        // Use reject with a string message for consistency
        await Code.expect(util.get('https://example.com/api')).to.reject('Not Found')
      })

      lab.test('should throw LocationSearchError when x-ms-bm-ws-info header is 1', async () => {
        // Mock response with special header
        wreckStub.get.resolves({
          res: {
            statusCode: 200,
            headers: { 'x-ms-bm-ws-info': '1' }
          },
          payload: {}
        })

        await Code.expect(util.get('https://example.com/api')).to.reject('Empty location search response indicated by header check of x-ms-bm-ws-info')
      })

      lab.test('should handle network errors and add URL info to message', async () => {
        // Mock network error
        const error = new Error('Response Error: Connection refused')
        wreckStub.get.rejects(error)

        await Code.expect(util.get('https://example.com/api?param=value')).to.reject('Response Error: Connection refused on GET https://example.com/api')
      })

      lab.test('should remove query parameters from URL in error messages', async () => {
        // This test specifically verifies the regex that removes query parameters

        // Test with various URL formats
        const testUrls = [
          {
            input: 'https://example.com/api?param=value&another=123',
            expected: 'https://example.com/api'
          },
          {
            input: 'https://example.com/api?param=special&chars=a+b%20c',
            expected: 'https://example.com/api'
          },
          {
            input: 'https://example.com/api?multiline=value\nwith\nnewlines',
            expected: 'https://example.com/api'
          }
        ]

        for (const testCase of testUrls) {
          // Reset the stub for each test case
          wreckStub.get.reset()
          wreckStub.get.rejects(new Error('Response Error: Connection refused'))

          await Code.expect(util.get(testCase.input)).to.reject(`Response Error: Connection refused on GET ${testCase.expected}`)
        }
      })
    })
  })

  lab.experiment('toMarked', () => {
    lab.test('Find text is marked', async () => {
      Code.expect(toMarked('This is some text to be marked', 'text')).to.equal('This is some <mark>text</mark> to be marked')
    })
    lab.test('Find text is marked when search term is a regex char', async () => {
      // note: this was required in the scenario where a single ( is used as a search term as the search
      // returns 2 river results containing the character ( which resulted in a template rendering
      // error ("SyntaxError: Invalid regular expression: /(()/: Unterminated group: (unknown path)").
      // A requirement to return no results for single character search side steps the template rendering
      // error but it seems prudent to escape charaters before passing them to the regex generator
      Code.expect(toMarked('This is some (text) to be marked', '(')).to.equal('This is some <mark>(</mark>text) to be marked')
    })
  })

  lab.experiment('cleanLocation', () => {
    lab.test('Find text is cleansed', async () => {
      Code.expect(cleanseLocation('This is some text to be cleansed', 'text')).to.equal('This is some text to be cleansed')
    })
    lab.test('Find text is cleansed when search term contains special character', async () => {
      Code.expect(cleanseLocation('This is some (text) to be cleansed <script>alert(\'TEST\')</script>', '(')).to.equal('This is some (text) to be cleansed scriptalert(\'TEST\')script')
    })
  })

  lab.experiment('remove spikes in telem', () => {
    lab.test('Removes spike in telem over 300m, should be 479 values returned', async () => {
      const telem = removeSpikes(spikeTelem)
      Code.expect(telem.length).to.equal(479)
    })
    lab.test('No spikes in telem all values under 300m, 480 values returned', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      Code.expect(telem.length).to.equal(480)
    })
  })
})
