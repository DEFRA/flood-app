const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')
const Sinon = require('sinon')
const Proxyquire = require('proxyquire')
const spikeTelem = require('../data/spikeTelem.json')
const nonSpikeTelem = require('../data/nonSpikeTelem.json')
const { toMarked, cleanseLocation, removeSpikes } = require('../../server/util')

describe('Util', () => {
  describe('get', () => {
    let wreckStub
    let util

    beforeEach(() => {
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

    afterEach(() => {
      Sinon.restore()
    })

    it('should successfully get data from a URL', async () => {
      const mockPayload = { data: 'test data' }
      wreckStub.get.resolves({
        res: { statusCode: 200, headers: {} },
        payload: mockPayload
      })

      const result = await util.get('https://example.com/api', { option: 'value' })

      expect(result).to.equal(mockPayload)
      expect(wreckStub.get.calledOnce).to.be.true()
      expect(wreckStub.get.firstCall.args[0]).to.equal('https://example.com/api')
      expect(wreckStub.get.firstCall.args[1]).to.equal({ option: 'value' })
    })

    it('should handle JSON responses with getJson', async () => {
      // Mock successful JSON response
      const mockPayload = { data: 'test data' }
      wreckStub.get.resolves({
        res: { statusCode: 200, headers: {} },
        payload: mockPayload
      })

      const result = await util.getJson('https://example.com/api')

      expect(result).to.equal(mockPayload)
      expect(wreckStub.get.calledOnce).to.be.true()
      expect(wreckStub.get.firstCall.args[0]).to.equal('https://example.com/api')
      expect(wreckStub.get.firstCall.args[1]).to.equal({ json: true })
    })

    it('should throw error when response status code is not 200', async () => {
      const errorPayload = new Error('Not Found')

      wreckStub.get.resolves({
        res: { statusCode: 404, headers: {} },
        payload: errorPayload
      })

      await expect(util.get('https://example.com/api')).to.reject('Not Found')
    })

    it('should throw LocationSearchError when x-ms-bm-ws-info header is 1', async () => {
      wreckStub.get.resolves({
        res: {
          statusCode: 200,
          headers: { 'x-ms-bm-ws-info': '1' }
        },
        payload: {}
      })

      await expect(util.get('https://example.com/api')).to.reject('Empty location search response indicated by header check of x-ms-bm-ws-info')
    })

    it('should handle network errors and add URL info to message', async () => {
      const error = new Error('Response Error: Connection refused')
      wreckStub.get.rejects(error)

      await expect(util.get('https://example.com/api?param=value')).to.reject('Response Error: Connection refused on GET https://example.com/api')
    })

    it('should remove query parameters from URL in error messages', async () => {
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

        await expect(util.get(testCase.input)).to.reject(`Response Error: Connection refused on GET ${testCase.expected}`)
      }
    })
  })

  describe('toMarked', () => {
    it('should mark found text', async () => {
      expect(toMarked('This is some text to be marked', 'text')).to.equal('This is some <mark>text</mark> to be marked')
    })

    it('should mark text when search term is a regex char', async () => {
      // note: this was required in the scenario where a single ( is used as a search term as the search
      // returns 2 river results containing the character ( which resulted in a template rendering
      // error ("SyntaxError: Invalid regular expression: /(()/: Unterminated group: (unknown path)").
      // A requirement to return no results for single character search side steps the template rendering
      // error but it seems prudent to escape charaters before passing them to the regex generator
      expect(toMarked('This is some (text) to be marked', '(')).to.equal('This is some <mark>(</mark>text) to be marked')
    })
  })

  describe('cleanLocation', () => {
    it('should cleanse text', async () => {
      expect(cleanseLocation('This is some text to be cleansed', 'text')).to.equal('This is some text to be cleansed')
    })

    it('should cleanse text when search term contains special character', async () => {
      expect(cleanseLocation('This is some (text) to be cleansed <script>alert(\'TEST\')</script>', '(')).to.equal('This is some (text) to be cleansed scriptalert(\'TEST\')script')
    })
  })

  describe('remove spikes in telem', () => {
    it('should return 479 values and remove spike in telem over 300m', async () => {
      const telem = removeSpikes(spikeTelem)
      expect(telem.length).to.equal(479)
    })

    it('should return 480 values with no spikes in telem all values under 300md', async () => {
      const telem = removeSpikes(nonSpikeTelem)
      expect(telem.length).to.equal(480)
    })
  })

})
