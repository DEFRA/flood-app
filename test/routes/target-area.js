'use strict'

const Hapi = require('@hapi/hapi')
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const sinon = require('sinon')
const lab = exports.lab = Lab.script()
const { parse } = require('node-html-parser')

lab.experiment('Target-area tests', () => {
  let sandbox
  let server

  lab.beforeEach(async () => {
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

  lab.afterEach(async () => {
    await server.stop()
    await sandbox.restore()
  })

  lab.test('GET /target-area with no query parameters', async () => {
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
    Code.expect(response.statusCode).to.equal(404)
    Code.expect(payload.message).to.equal('Not Found')
  })
  lab.test('GET target-area 011WAFDW', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: [
          {
            ta_id: 229,
            ta_code: '011WAFDW',
            ta_name: 'Upper River Derwent, Stonethwaite Beck and Derwent Water',
            ta_description: 'The Upper Derwent from Seathwaite to Derwent Water',
            situation: ' The lake level has risen at the Lodore river gauge as a result of todays heavy rainfall.  Consequently, flooding of roads and farmland is possible between 19:00 today 05/08/2020 and 05:00 tomorrow, 06/08/2020.  Flooding is expected to affect low lying land and roads in the Seatoller, Stonethwaite, Rosthwaite, Grange-in-Borrowdale and Derwent Water shoreline areas. High river and lake levels are possible on the River Derwent, Stonethwaite Beck, Watendlath Beck, Derwent Water and their tributaries.   Most of the rain has past through the area, with some showers remaining.  The lake level is expected to peak at 1.5m at approximately 01:45 on 06/08/2020.',
            quick_dial: 141029,
            situation_changed: '2020-08-05T18:23:00.000Z',
            severity_changed: '2020-08-05T18:23:00.000Z',
            message_received: '2020-08-05T18:23:33.836Z',
            severity_value: 1,
            severity: 'Flood alert',
            geometry: '{"type":"Point","coordinates":[-3.14775299277944,54.5601419091569]}'
          }
        ]
      }
    }

    const fakeFloodArea = () => {
      return {
        id: 11473,
        area: 'Cumbria and Lancashire',
        code: '011WAFDW',
        name: 'Upper River Derwent, Stonethwaite Beck and Derwent Water',
        description: 'The Upper Derwent from Seathwaite to Derwent Water',
        localauthorityname: 'Cumbria',
        quickdialnumber: '141029',
        riverorsea: 'Derwent, Stonethwaite Beck',
        geom: '{"type":"MultiPolygon","coordinates":[]}',
        centroid: '{"type":"Point","coordinates":[-3.14775299277944,54.5601419091569]}'
      }
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

    Code.expect(response.statusCode).to.equal(200)

    const root = parse(response.payload)

    const h1Found = root.querySelectorAll('h1').some(h => h.textContent.trim() === 'Flood alert for Upper River Derwent, Stonethwaite Beck and Derwent Water')
    Code.expect(h1Found, 'Heading for target area found').to.be.true()

    const anchorFound = root.querySelectorAll('a').some(a =>
      a.text === 'Find a river, sea, groundwater or rainfall level in this area' &&
      a.attributes.href === '/river-and-sea-levels/target-area/011WAFDW'
    )
    Code.expect(anchorFound, 'Link to levels in the area found').to.be.true()
  })
  lab.test('GET target-area 011WAFDW  blank situation text', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: [
          {
            ta_id: 229,
            ta_code: '011WAFDW',
            ta_name: 'Upper River Derwent, Stonethwaite Beck and Derwent Water',
            ta_description: 'The Upper Derwent from Seathwaite to Derwent Water',
            situation: '',
            quick_dial: 141029,
            situation_changed: '2020-08-05T18:23:00.000Z',
            severity_changed: '2020-08-05T18:23:00.000Z',
            message_received: '2020-08-05T18:23:33.836Z',
            severity_value: 1,
            severity: 'Flood alert',
            geometry: '{"type":"Point","coordinates":[-3.14775299277944,54.5601419091569]}'
          }
        ]
      }
    }

    const fakeFloodArea = () => {
      return {
        id: 11473,
        area: 'Cumbria and Lancashire',
        code: '011WAFDW',
        name: 'Upper River Derwent, Stonethwaite Beck and Derwent Water',
        description: 'The Upper Derwent from Seathwaite to Derwent Water',
        localauthorityname: 'Cumbria',
        quickdialnumber: '141029',
        riverorsea: 'Derwent, Stonethwaite Beck',
        geom: '{"type":"MultiPolygon","coordinates":[]}',
        centroid: '{"type":"Point","coordinates":[-3.14775299277944,54.5601419091569]}'
      }
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

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.')
  })
  lab.test('GET target-area with unknown parameter e.g. facebook click id', async () => {
    const floodService = require('../../server/services/flood')

    const fakeFloodData = () => {
      return {
        floods: [
          {
            ta_id: 229,
            ta_code: '011WAFDW',
            ta_name: 'Upper River Derwent, Stonethwaite Beck and Derwent Water',
            ta_description: 'The Upper Derwent from Seathwaite to Derwent Water',
            situation: '',
            quick_dial: 141029,
            situation_changed: '2020-08-05T18:23:00.000Z',
            severity_changed: '2020-08-05T18:23:00.000Z',
            message_received: '2020-08-05T18:23:33.836Z',
            severity_value: 1,
            severity: 'Flood alert',
            geometry: '{"type":"Point","coordinates":[-3.14775299277944,54.5601419091569]}'
          }
        ]
      }
    }

    const fakeFloodArea = () => {
      return {
        id: 11473,
        area: 'Cumbria and Lancashire',
        code: '011WAFDW',
        name: 'Upper River Derwent, Stonethwaite Beck and Derwent Water',
        description: 'The Upper Derwent from Seathwaite to Derwent Water',
        localauthorityname: 'Cumbria',
        quickdialnumber: '141029',
        riverorsea: 'Derwent, Stonethwaite Beck',
        geom: '{"type":"MultiPolygon","coordinates":[]}',
        centroid: '{"type":"Point","coordinates":[-3.14775299277944,54.5601419091569]}'
      }
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

    Code.expect(response.statusCode).to.equal(200)
    Code.expect(response.payload).to.contain('We\'ll update this page when there\'s a flood alert in the area, which means flooding to low lying land is possible.')
  })
})
