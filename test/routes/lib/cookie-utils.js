'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it } = exports.lab = Lab.script()

const { normalisePolicy, sanitiseReturnUrl, getCookieDomainCandidates } = require('../../../server/routes/lib/cookie-utils')

describe('Route lib - cookie utils', () => {
  describe('normalisePolicy', () => {
    it('reads consent from a policy object', () => {
      expect(normalisePolicy({ analytics: true })).to.equal({ analytics: true })
    })

    it('reads withdrawn consent from a policy object', () => {
      expect(normalisePolicy({ analytics: false })).to.equal({ analytics: false })
    })

    it('coerces a truthy non boolean analytics value', () => {
      expect(normalisePolicy({ analytics: 'yes' })).to.equal({ analytics: true })
    })

    it('ignores a policy object with no analytics key', () => {
      expect(normalisePolicy({})).to.equal({ analytics: false })
    })

    it('parses a policy delivered as a JSON string', () => {
      expect(normalisePolicy('{"analytics":true}')).to.equal({ analytics: true })
    })

    it('parses a withdrawn policy delivered as a JSON string', () => {
      expect(normalisePolicy('{"analytics":false}')).to.equal({ analytics: false })
    })

    it('falls back when the JSON string parses to a number', () => {
      expect(normalisePolicy('123', 'true')).to.equal({ analytics: true })
    })

    it('falls back when the JSON string parses to null', () => {
      expect(normalisePolicy('null', 'true')).to.equal({ analytics: true })
    })

    it('falls back when the string is not valid JSON', () => {
      expect(normalisePolicy('not-json', 'true')).to.equal({ analytics: true })
    })

    it('falls back to the legacy usage cookie when there is no policy', () => {
      expect(normalisePolicy(undefined, 'true')).to.equal({ analytics: true })
    })

    it('treats a usage cookie value other than "true" as no consent', () => {
      expect(normalisePolicy(undefined, 'false')).to.equal({ analytics: false })
    })

    it('defaults to no consent when nothing is supplied', () => {
      expect(normalisePolicy()).to.equal({ analytics: false })
    })
  })

  describe('sanitiseReturnUrl', () => {
    it('keeps a relative path', () => {
      expect(sanitiseReturnUrl('/river-and-sea-levels')).to.equal('/river-and-sea-levels')
    })

    it('keeps a relative path with a query string', () => {
      expect(sanitiseReturnUrl('/river-and-sea-levels?q=york')).to.equal('/river-and-sea-levels?q=york')
    })

    it('rejects a protocol relative url', () => {
      expect(sanitiseReturnUrl('//evil.example.com')).to.equal('/')
    })

    it('rejects an absolute url', () => {
      expect(sanitiseReturnUrl('https://evil.example.com')).to.equal('/')
    })

    it('rejects a path that does not start with a slash', () => {
      expect(sanitiseReturnUrl('river-and-sea-levels')).to.equal('/')
    })

    it('rejects an empty string', () => {
      expect(sanitiseReturnUrl('')).to.equal('/')
    })

    it('rejects undefined', () => {
      expect(sanitiseReturnUrl(undefined)).to.equal('/')
    })

    it('rejects a non string value', () => {
      expect(sanitiseReturnUrl(123)).to.equal('/')
    })

    it('rejects a backslash prefixed url', () => {
      expect(sanitiseReturnUrl('/\\evil.example.com')).to.equal('/')
    })

    it('rejects a url containing a backslash', () => {
      expect(sanitiseReturnUrl('/river-and-sea-levels\\evil.example.com')).to.equal('/')
    })
  })

  describe('getCookieDomainCandidates', () => {
    it('returns every parent domain level', () => {
      expect(getCookieDomainCandidates('www.check-for-flooding.service.gov.uk')).to.equal([
        '.www.check-for-flooding.service.gov.uk',
        '.check-for-flooding.service.gov.uk',
        '.service.gov.uk',
        '.gov.uk'
      ])
    })

    it('returns the host and its parent for a two level domain', () => {
      expect(getCookieDomainCandidates('www.example.com')).to.equal(['.www.example.com', '.example.com'])
    })

    it('returns no candidates for a single label host', () => {
      expect(getCookieDomainCandidates('localhost')).to.equal([])
    })

    it('returns no candidates for an ip address', () => {
      expect(getCookieDomainCandidates('127.0.0.1')).to.equal([])
    })

    it('returns no candidates for a missing hostname', () => {
      expect(getCookieDomainCandidates(undefined)).to.equal([])
    })

    it('returns no candidates for a non string hostname', () => {
      expect(getCookieDomainCandidates(123)).to.equal([])
    })
  })
})
