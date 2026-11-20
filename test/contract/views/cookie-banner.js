'use strict'

const path = require('path')
const nunjucks = require('nunjucks')

const { parse } = require('node-html-parser')

// Wraps the partial with macro imports so it can be rendered in isolation
const TEMPLATE = `
{% from "cookie-banner/macro.njk" import govukCookieBanner %}
{% from "notification-banner/macro.njk" import govukNotificationBanner %}
{% include "partials/cookie-banner.html" %}
`

function renderPartial (context = {}) {
  const env = nunjucks.configure([
    path.join(__dirname, '../../../server/views'),
    path.join(__dirname, '../../../node_modules/govuk-frontend/dist/govuk'),
    path.join(__dirname, '../../../node_modules/govuk-frontend/dist/govuk/components')
  ], { autoescape: true, noCache: true })

  return env.renderString(TEMPLATE, context)
}

describe('Contract - Views - Cookie Banner', () => {
  describe('when no cookie policy is set', () => {
    let root

    beforeAll(() => {
      root = parse(renderPartial({ currentUrl: '/current-page' }))
    })

    it('renders the outer banner container as a labelled landmark', () => {
      const banner = root.querySelector('#cookie-banner')
      expect(banner).toBeDefined()
      // a section with an accessible name is an implicit role="region"
      expect(banner.tagName).toBe('SECTION')
      expect(banner.getAttribute('aria-label')).toBe('Cookies on Check for flooding')
    })

    it('wraps the banner in a form that POSTs to /cookie-preferences', () => {
      const form = root.querySelector('#cookie-banner form')
      expect(form.getAttribute('action')).toBe('/cookie-preferences')
      expect(form.getAttribute('method')).toBe('POST')
    })

    it('includes a hidden returnUrl input populated from context', () => {
      const input = root.querySelector('input[name="returnUrl"]')
      expect(input.getAttribute('type')).toBe('hidden')
      expect(input.getAttribute('value')).toBe('/current-page')
    })

    it('renders the accept button with the correct name, value and type', () => {
      const btn = root.querySelector('button[value="accept"]')
      expect(btn).toBeDefined()
      expect(btn.getAttribute('type')).toBe('submit')
      expect(btn.getAttribute('name')).toBe('analytics-consent')
      expect(btn.text.trim()).toBe('Accept analytics cookies')
    })

    it('renders the reject button with the correct name, value and type', () => {
      const btn = root.querySelector('button[value="reject"]')
      expect(btn).toBeDefined()
      expect(btn.getAttribute('type')).toBe('submit')
      expect(btn.getAttribute('name')).toBe('analytics-consent')
      expect(btn.text.trim()).toBe('Reject analytics cookies')
    })

    it('renders a View cookies link pointing to /cookies', () => {
      const link = root.querySelectorAll('a').find(a => a.text.trim() === 'View cookies')
      expect(link).toBeDefined()
      expect(link.getAttribute('href')).toBe('/cookies')
    })

    it('does not render the confirmation notification banner', () => {
      expect(root.querySelector('.govuk-notification-banner')).toBeNull()
    })
  })

  describe('when cookie policy has already been set (hasCookiePolicy = true)', () => {
    let root

    beforeAll(() => {
      root = parse(renderPartial({ hasCookiePolicy: true }))
    })

    it('does not render the cookie banner', () => {
      expect(root.querySelector('#cookie-banner')).toBeNull()
    })

    it('does not render the confirmation notification banner', () => {
      expect(root.querySelector('.govuk-notification-banner')).toBeNull()
    })
  })

  describe('when cookieChoiceMade is accept', () => {
    let root

    beforeAll(() => {
      root = parse(renderPartial({ hasCookiePolicy: true, cookieChoiceMade: 'accept' }))
    })

    it('reveals the accept confirmation message and hides the prompt', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages.length).toBe(3)
      expect(messages[0].hasAttribute('hidden')).toBe(true)
      expect(messages[1].hasAttribute('hidden')).toBe(false)
      expect(messages[1].getAttribute('role')).toBe('alert')
      expect(messages[2].hasAttribute('hidden')).toBe(true)
    })

    it('confirms the user accepted analytics cookies', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages[1].text).toInclude('accepted analytics cookies')
    })

    it('includes a link to change cookie settings', () => {
      const link = root.querySelectorAll('a').find(a => a.text.trim() === 'change your cookie settings')
      expect(link).toBeDefined()
      expect(link.getAttribute('href')).toBe('/cookies')
    })
  })

  describe('when cookieChoiceMade is reject', () => {
    let root

    beforeAll(() => {
      root = parse(renderPartial({ hasCookiePolicy: true, cookieChoiceMade: 'reject' }))
    })

    it('confirms the user rejected analytics cookies', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages[2].hasAttribute('hidden')).toBe(false)
      expect(messages[2].text).toInclude('rejected analytics cookies')
    })
  })

  describe('when cookieChoiceMade is stale (cookies cleared but query param still present)', () => {
    let root

    beforeAll(() => {
      root = parse(renderPartial({ hasCookiePolicy: false, cookieChoiceMade: 'accept' }))
    })

    it('shows the prompt to make a choice and hides both confirmation messages', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages[0].hasAttribute('hidden')).toBe(false)
      expect(messages[1].hasAttribute('hidden')).toBe(true)
      expect(messages[2].hasAttribute('hidden')).toBe(true)
    })
  })
})
