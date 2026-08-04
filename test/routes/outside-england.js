'use strict'

const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { describe, it, beforeEach } = exports.lab = Lab.script()

const outsideEnglandRouteMethods = require('../../server/routes/outside-england')

describe('Outside England route', () => {
  let getMethod, viewName, context

  beforeEach(() => {
    getMethod = outsideEnglandRouteMethods.find((route) => route.method === 'GET')
    viewName = null
    context = null
  })

  it('should have a GET handler function', () => {
    expect(getMethod).to.exist()
    expect(getMethod.handler).to.be.a.function()
  })

  it('should service the /outside-england route', () => {
    expect(getMethod.path).to.equal('/outside-england')
  })

  it('should set the pageTitle in the context model', () => {
    const mockH = {
      view: (view, model) => {
        viewName = view
        context = model
      }
    }
    getMethod.handler({}, mockH)
    expect(viewName).to.equal('outside-england')
    expect(context.model.pageTitle).to.exist()
    expect(context.model.pageTitle).to.equal('Error: Find location - Check for flooding') // ` - GOV.UK` is added by the layout.njk template
  })
})
