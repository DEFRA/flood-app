const HttpsProxyAgent = require('https-proxy-agent')
const config = require('./config')
const wreck = require('wreck').defaults({
  timeout: 10000
})
let wreckExt
if (config.httpProxy) {
  wreckExt = require('wreck').defaults({
    timeout: config.httpTimeoutMs,
    agent: new HttpsProxyAgent(config.httpProxy)
  })
}

function request (method, url, options, ext = false) {
  const thisWreck = (ext && wreckExt) ? wreckExt : wreck
  return thisWreck[method](url, options)
    .then(response => {
      const res = response.res
      const payload = response.payload

      if (res.statusCode !== 200) {
        const err = (payload || new Error('Unknown error'))
        throw err
      }

      return payload
    })
}

function get (url, options, ext = false) {
  return request('get', url, options, ext)
}

function post (url, options) {
  return request('post', url, options)
}

function postJson (url, options) {
  options = options || {}
  options.json = true

  return post(url, options)
}

function getJson (url, ext = false) {
  return get(url, { json: true }, ext)
}

module.exports = {
  get: get,
  post: post,
  getJson: getJson,
  postJson: postJson,
  request: request
}
