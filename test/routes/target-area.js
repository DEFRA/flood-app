'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const { describe, it, beforeEach, afterEach } = exports.lab = Lab.script()
const { parse } = require('node-html-parser')
const fakeTargetAreaFloodData = require('../data/fakeTargetAreaFloodData.json')
const { linkChecker } = require('../lib/helpers/html-expectations')
const { validateFooterPresent } = require('../lib/helpers/context-footer-checker')

describe('Target-area tests', () => {
  let sandbox
  let server

  beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/flood.js')]
    delete require.cache[require.resolve('../../server/services/server-methods.js')]
    delete require.cache[require.resolve('../../server/routes/target-area.js')]

    sandbox = await sinon.createSandbox()

    server = Hapi.server({
      port: 3000,
      host: 'localhost',
      routes: {
        validate: {
          options: {
            abortEarly: false,
            stripUnknown: true
          }
        }
      }
    })
  })

  afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  it('GET /target-area with no query parameters', async () => {
    const targetAreaPlugin = {
      plugin: {
        name: 'target-area',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(targetAreaPlugin)

    await server.initialize()

    const options = {
      method: 'GET',
      url: '/target-area'
    }
    const response = await server.inject(options)
    const payload = JSON.parse(response.payload)
    expect(response.statusCode).to.equal(404)
    expect(payload.message).to.equal('Not Found')
  })
  it('GET target-area 011WAFDW', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)
    const h1Found = root.querySelectorAll('h1').some(h => h.textContent.trim() === 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    expect(h1Found, 'Heading for target area found').to.be.true()

    const anchorFound = root.querySelectorAll('a').some(a =>
      a.text === 'Find a river, sea, groundwater or rainfall level in this area' &&
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )
    expect(anchorFound, 'Link to levels in the area found').to.be.true()
  })
  it('GET target-area 011WAFDW  blank situation text', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].situation = ''

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }
    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.')
  })
  it('GET target-area with unknown parameter e.g. facebook click id', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW?q=000000000000000&fbclid=\'7890789078&*()&*)&)&*\''
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.contain('We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.')
  })
  it('Check flood severity banner link for Flood alert', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Flooding is possible - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-alert">\s*be prepared\s*<\/a><\/strong>\s*<\/div>/)
  })
  it('Check flood severity banner link for Flood warning', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].severity_value = 2
      fakeTargetAreaFloodData.floods[0].severity = 'Flood warning'

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Flooding is expected - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#flood-warning">\s*act now\s*<\/a><\/strong>\s*<\/div>/)
  })
  it('Check flood severity banner link for Flood warning', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      fakeTargetAreaFloodData.floods[0].severity_value = 3
      fakeTargetAreaFloodData.floods[0].severity = 'Severe flood warning'

      return {
        floods: fakeTargetAreaFloodData.floods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)

    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)
    expect(response.statusCode).to.equal(200)
    expect(response.payload).to.match(/<div class="defra-flood-status-item__text">\s*<strong>Danger to life - <a class="govuk-link" href="https:\/\/www\.gov\.uk\/guidance\/flood-alerts-and-warnings-what-they-are-and-what-to-do#severe-flood-warning">\s*act now\s*<\/a><\/strong>\s*<\/div>/)
  })
  it('GET target-area 011WAFDW with no flood alerts active', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: []
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)

    const h1Found = root.querySelectorAll('h1').some(h => h.textContent.trim() === 'Upper River Derwent, Stonethwaite Beck and Derwent Water flood alert area')
    expect(h1Found, 'Heading for target area found').to.be.true()

    const anchorFound = root.querySelectorAll('a').some(a =>
      a.text === 'Find a river, sea, groundwater or rainfall level in this area' &&
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )
    expect(anchorFound, 'Link to levels in the area found').to.be.true()
  })
  it('GET target-area 011WAFDW with severe flood alerts active', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.severeFlood
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.area
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/011WAFDW'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)
    expect(response.payload).to.contain('Severe flood warning for Upper River Derwent, Stonethwaite Beck and Derwent Water')

    const anchorFound = root.querySelectorAll('a').some(a =>
      a.text === 'Find a river, sea, groundwater or rainfall level in this area' &&
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )
    expect(anchorFound, 'Link to levels in the area found').to.be.true()
  })
  it('No floods alerts but a flood alert in the wider area message in banner', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: fakeTargetAreaFloodData.multiFloods
      }
    }

    const fakeFloodArea = () => {
      return fakeTargetAreaFloodData.floodsInWiderAreaPlace
    }

    sandbox.stub(floodService, 'getFloods').callsFake(fakeFloodData)
    sandbox.stub(floodService, 'getFloodArea').callsFake(fakeFloodArea)

    const targetAreaPlugin = {
      plugin: {
        name: 'target',
        register: (server, options) => {
          server.route(require('../../server/routes/target-area'))
        }
      }
    }

    await server.register(require('../../server/plugins/views'))
    await server.register(require('../../server/plugins/session'))
    await server.register(targetAreaPlugin)
    // Add Cache methods to server
    const registerServerMethods = require('../../server/services/server-methods')
    registerServerMethods(server)

    await server.initialize()
    const options = {
      method: 'GET',
      url: '/target-area/123FWF366'
    }

    const response = await server.inject(options)

    expect(response.statusCode).to.equal(200)
    const root = parse(response.payload)
    const relatedContentLinks = root.querySelectorAll('.defra-related-items a')
    expect(relatedContentLinks.length, 'Should be 5 related content links').to.equal(5)
    linkChecker(relatedContentLinks, 'Prepare for flooding', 'https://www.gov.uk/prepare-for-flooding')
    linkChecker(relatedContentLinks, 'What to do before or during a flood', 'https://www.gov.uk/help-during-flood')
    linkChecker(relatedContentLinks, 'What to do after a flood', 'https://www.gov.uk/after-flood')
    linkChecker(relatedContentLinks, 'Check your long term flood risk')
    linkChecker(relatedContentLinks, 'Report a flood', 'https://www.gov.uk/report-flood-cause')
    // context footer check
    validateFooterPresent(response)
    expect(response.payload).to.contain('There are no flood warnings in this area, but there is <a href="/target-area/123WAF984">a flood alert in the wider area</a>')
  })
})
