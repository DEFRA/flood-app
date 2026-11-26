'use strict'

const outsideEnglandRouteMethods = require('../../server/routes/outside-england')

describe('Outside England route', () => {
  let getMethod, viewName, context

  beforeEach(() => {
    getMethod = outsideEnglandRouteMethods.find((route) => route.method === 'GET')
    viewName = null
    context = null
  })

  it('should have a GET handler function', () => {
    expect(getMethod).not.toBeNil()
    expect(getMethod.handler).toBeFunction()
  })

  it('should service the /outside-england route', () => {
    expect(getMethod.path).toBe('/outside-england')
  })

  it('should set the pageTitle in the context model', () => {
    const mockH = {
      view: (view, model) => {
        viewName = view
        context = model
      }
    }
    getMethod.handler({}, mockH)
    expect(viewName).toBe('outside-england')
    expect(context.model.pageTitle).not.toBeNil()
    expect(context.model.pageTitle).toBe('Error: Find location - Check for flooding') // ` - GOV.UK` is added by the layout.njk template
  })
})
