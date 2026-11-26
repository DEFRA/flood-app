'use strict'

const { normalisePolicy, sanitiseReturnUrl, getCookieDomainCandidates } = require('../../../server/routes/lib/cookie-utils')

describe('Route lib - cookie utils', () => {
  describe('normalisePolicy', () => {
    it('reads consent from a policy object', () => {
      expect(normalisePolicy({ analytics: true })).toEqual({ analytics: true })
    })

    it('reads withdrawn consent from a policy object', () => {
      expect(normalisePolicy({ analytics: false })).toEqual({ analytics: false })
    })

    it('coerces a truthy non boolean analytics value', () => {
      expect(normalisePolicy({ analytics: 'yes' })).toEqual({ analytics: true })
    })

    it('ignores a policy object with no analytics key', () => {
      expect(normalisePolicy({})).toEqual({ analytics: false })
    })

    it('parses a policy delivered as a JSON string', () => {
      expect(normalisePolicy('{"analytics":true}')).toEqual({ analytics: true })
    })

    it('parses a withdrawn policy delivered as a JSON string', () => {
      expect(normalisePolicy('{"analytics":false}')).toEqual({ analytics: false })
    })

    it('falls back when the JSON string parses to a number', () => {
      expect(normalisePolicy('123', 'true')).toEqual({ analytics: true })
    })

    it('falls back when the JSON string parses to null', () => {
      expect(normalisePolicy('null', 'true')).toEqual({ analytics: true })
    })

    it('falls back when the string is not valid JSON', () => {
      expect(normalisePolicy('not-json', 'true')).toEqual({ analytics: true })
    })

    it('falls back to the legacy usage cookie when there is no policy', () => {
      expect(normalisePolicy(undefined, 'true')).toEqual({ analytics: true })
    })

    it('treats a usage cookie value other than "true" as no consent', () => {
      expect(normalisePolicy(undefined, 'false')).toEqual({ analytics: false })
    })

    it('defaults to no consent when nothing is supplied', () => {
      expect(normalisePolicy()).toEqual({ analytics: false })
    })
  })

  describe('sanitiseReturnUrl', () => {
    it('keeps a relative path', () => {
      expect(sanitiseReturnUrl('/river-and-sea-levels')).toBe('/river-and-sea-levels')
    })

    it('keeps a relative path with a query string', () => {
      expect(sanitiseReturnUrl('/river-and-sea-levels?q=york')).toBe('/river-and-sea-levels?q=york')
    })

    it('rejects a protocol relative url', () => {
      expect(sanitiseReturnUrl('//evil.example.com')).toBe('/')
    })

    it('rejects an absolute url', () => {
      expect(sanitiseReturnUrl('https://evil.example.com')).toBe('/')
    })

    it('rejects a path that does not start with a slash', () => {
      expect(sanitiseReturnUrl('river-and-sea-levels')).toBe('/')
    })

    it('rejects an empty string', () => {
      expect(sanitiseReturnUrl('')).toBe('/')
    })

    it('rejects undefined', () => {
      expect(sanitiseReturnUrl(undefined)).toBe('/')
    })

    it('rejects a non string value', () => {
      expect(sanitiseReturnUrl(123)).toBe('/')
    })

    it('rejects a backslash prefixed url', () => {
      expect(sanitiseReturnUrl('/\\evil.example.com')).toBe('/')
    })

    it('rejects a url containing a backslash', () => {
      expect(sanitiseReturnUrl('/river-and-sea-levels\\evil.example.com')).toBe('/')
    })
  })

  describe('getCookieDomainCandidates', () => {
    it('returns every parent domain level', () => {
      expect(getCookieDomainCandidates('www.check-for-flooding.service.gov.uk')).toEqual([
        '.www.check-for-flooding.service.gov.uk',
        '.check-for-flooding.service.gov.uk',
        '.service.gov.uk',
        '.gov.uk'
      ])
    })

    it('returns the host and its parent for a two level domain', () => {
      expect(getCookieDomainCandidates('www.example.com')).toEqual(['.www.example.com', '.example.com'])
    })

    it('returns no candidates for a single label host', () => {
      expect(getCookieDomainCandidates('localhost')).toEqual([])
    })

    it('returns no candidates for an ip address', () => {
      expect(getCookieDomainCandidates('127.0.0.1')).toEqual([])
    })

    it('returns no candidates for a missing hostname', () => {
      expect(getCookieDomainCandidates(undefined)).toEqual([])
    })

    it('returns no candidates for a non string hostname', () => {
      expect(getCookieDomainCandidates(123)).toEqual([])
    })
  })
})
