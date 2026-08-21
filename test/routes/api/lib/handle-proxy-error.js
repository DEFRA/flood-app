const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { experiment, it } = exports.lab = Lab.script()
const { handleProxyError } = require('../../../../server/routes/api/lib/handle-proxy-error')

function fakeToolkit () {
  const response = { code: sinon.stub().returnsThis() }
  const h = { response: sinon.stub().returns(response) }
  return { h, response }
}

experiment('handleProxyError', () => {
  it('propagates a structured 4xx client error status code and message', async () => {
    const { h, response } = fakeToolkit()
    const err = { statusCode: 400, message: 'Invalid bbox format' }

    handleProxyError(h, err, 'fallback message')

    expect(h.response.calledWith({ error: 'Invalid bbox format' })).to.equal(true)
    expect(response.code.calledWith(400)).to.equal(true)
  })

  it('falls back to the fallback message when a 4xx error has no message', async () => {
    const { h, response } = fakeToolkit()
    const err = { statusCode: 404 }

    handleProxyError(h, err, 'fallback message')

    expect(h.response.calledWith({ error: 'fallback message' })).to.equal(true)
    expect(response.code.calledWith(404)).to.equal(true)
  })

  it('treats a missing/undefined error as a generic 500', async () => {
    const { h, response } = fakeToolkit()

    handleProxyError(h, undefined, 'fallback message')

    expect(h.response.calledWith({ error: 'fallback message' })).to.equal(true)
    expect(response.code.calledWith(500)).to.equal(true)
  })

  it('treats a non-numeric statusCode as a generic 500', async () => {
    const { h, response } = fakeToolkit()
    const err = { statusCode: '400', message: 'Invalid bbox format' }

    handleProxyError(h, err, 'fallback message')

    expect(h.response.calledWith({ error: 'fallback message' })).to.equal(true)
    expect(response.code.calledWith(500)).to.equal(true)
  })

  it('treats a numeric statusCode below 400 as a generic 500', async () => {
    const { h, response } = fakeToolkit()
    const err = { statusCode: 200, message: 'Not really an error' }

    handleProxyError(h, err, 'fallback message')

    expect(h.response.calledWith({ error: 'fallback message' })).to.equal(true)
    expect(response.code.calledWith(500)).to.equal(true)
  })

  it('treats a 5xx error as a generic 500', async () => {
    const { h, response } = fakeToolkit()
    const err = { statusCode: 503, message: 'Service unavailable' }

    handleProxyError(h, err, 'fallback message')

    expect(h.response.calledWith({ error: 'fallback message' })).to.equal(true)
    expect(response.code.calledWith(500)).to.equal(true)
  })
})
