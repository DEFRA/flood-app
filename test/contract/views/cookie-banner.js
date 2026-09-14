'use strict'

const path = require('path')
const nunjucks = require('nunjucks')
const Lab = require('@hapi/lab')

const { expect } = require('@hapi/code')

const { describe, it, before } = exports.lab = Lab.script()

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

    before(() => {
      root = parse(renderPartial({ currentUrl: '/current-page' }))
    })

    it('renders the outer banner container as a labelled landmark', () => {
      const banner = root.querySelector('#cookie-banner')
      expect(banner).to.exist()
      // a section with an accessible name is an implicit role="region"
      expect(banner.tagName).to.equal('SECTION')
      expect(banner.getAttribute('aria-label')).to.equal('Cookies on Check for flooding')
    })

    it('wraps the banner in a form that POSTs to /cookie-preferences', () => {
      const form = root.querySelector('#cookie-banner form')
      expect(form.getAttribute('action')).to.equal('/cookie-preferences')
      expect(form.getAttribute('method')).to.equal('POST')
    })

    it('includes a hidden returnUrl input populated from context', () => {
      const input = root.querySelector('input[name="returnUrl"]')
      expect(input.getAttribute('type')).to.equal('hidden')
      expect(input.getAttribute('value')).to.equal('/current-page')
    })

    it('renders the accept button with the correct name, value and type', () => {
      const btn = root.querySelector('button[value="accept"]')
      expect(btn).to.exist()
      expect(btn.getAttribute('type')).to.equal('submit')
      expect(btn.getAttribute('name')).to.equal('analytics-consent')
      expect(btn.text.trim()).to.equal('Accept analytics cookies')
    })

    it('renders the reject button with the correct name, value and type', () => {
      const btn = root.querySelector('button[value="reject"]')
      expect(btn).to.exist()
      expect(btn.getAttribute('type')).to.equal('submit')
      expect(btn.getAttribute('name')).to.equal('analytics-consent')
      expect(btn.text.trim()).to.equal('Reject analytics cookies')
    })

    it('renders a View cookies link pointing to /cookies', () => {
      const link = root.querySelectorAll('a').find(a => a.text.trim() === 'View cookies')
      expect(link).to.exist()
      expect(link.getAttribute('href')).to.equal('/cookies')
    })

    it('does not render the confirmation notification banner', () => {
      expect(root.querySelector('.govuk-notification-banner')).to.not.exist()
    })
  })

  describe('when cookie policy has already been set (hasCookiePolicy = true)', () => {
    let root

    before(() => {
      root = parse(renderPartial({ hasCookiePolicy: true }))
    })

    it('does not render the cookie banner', () => {
      expect(root.querySelector('#cookie-banner')).to.not.exist()
    })

    it('does not render the confirmation notification banner', () => {
      expect(root.querySelector('.govuk-notification-banner')).to.not.exist()
    })
  })

  describe('when cookieChoiceMade is accept', () => {
    let root

    before(() => {
      root = parse(renderPartial({ hasCookiePolicy: true, cookieChoiceMade: 'accept' }))
    })

    it('reveals the accept confirmation message and hides the prompt', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages.length).to.equal(3)
      expect(messages[0].hasAttribute('hidden')).to.be.true()
      expect(messages[1].hasAttribute('hidden')).to.be.false()
      expect(messages[1].getAttribute('role')).to.equal('alert')
      expect(messages[2].hasAttribute('hidden')).to.be.true()
    })

    it('confirms the user accepted analytics cookies', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages[1].text).to.include('accepted analytics cookies')
    })

    it('includes a link to change cookie settings', () => {
      const link = root.querySelectorAll('a').find(a => a.text.trim() === 'change your cookie settings')
      expect(link).to.exist()
      expect(link.getAttribute('href')).to.equal('/cookies')
    })
  })

  describe('when cookieChoiceMade is reject', () => {
    let root

    before(() => {
      root = parse(renderPartial({ hasCookiePolicy: true, cookieChoiceMade: 'reject' }))
    })

    it('confirms the user rejected analytics cookies', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages[2].hasAttribute('hidden')).to.be.false()
      expect(messages[2].text).to.include('rejected analytics cookies')
    })
  })

  describe('when cookieChoiceMade is stale (cookies cleared but query param still present)', () => {
    let root

    before(() => {
      root = parse(renderPartial({ hasCookiePolicy: false, cookieChoiceMade: 'accept' }))
    })

    it('shows the prompt to make a choice and hides both confirmation messages', () => {
      const messages = root.querySelectorAll('.govuk-cookie-banner__message')
      expect(messages[0].hasAttribute('hidden')).to.be.false()
      expect(messages[1].hasAttribute('hidden')).to.be.true()
      expect(messages[2].hasAttribute('hidden')).to.be.true()
    })
  })
})
