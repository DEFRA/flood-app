'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const sinon = require('sinon')
const floodService = require('../../server/services/flood')

const isEngland = () => {
  return { is_england: true }
}

lab.experiment('location service test', () => {
  let sandbox

  lab.beforeEach(async () => {
    delete require.cache[require.resolve('../../server/services/location')]
    sandbox = await sinon.createSandbox()
  })

  lab.afterEach(async () => {
    await sandbox.restore()
  })
  lab.test('Check for invalid location', async () => {
    const fakeLocationData = () => {
      return {}
    }

    const util = require('../../server/util')

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const rejects = async () => {
      await location.find('Invalid').then((resolvedValue) => {
        return resolvedValue
      })
    }
    const result = await Code.expect(rejects()).to.reject()
    Code.expect(result).to.be.a.object()
    Code.expect(result.message).to.equal('Location search returned status: unknown, message: not set')
  })

  lab.test('Check for valid location', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials 1',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 2019 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        resourceSets: [
          {
            estimatedTotal: 1,
            resources: [
              {
                __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                bbox: [
                  51.12405776977539,
                  0.8380475640296936,
                  51.17716598510742,
                  0.9264887571334839
                ],
                name: 'Ashford, Kent',
                point: {
                  type: 'Point',
                  coordinates: [
                    51.14772797,
                    0.87279475
                  ]
                },
                address: {
                  adminDistrict: 'England',
                  adminDistrict2: 'Kent',
                  countryRegion: 'United Kingdom',
                  formattedAddress: 'Ashford, Kent',
                  locality: 'Ashford',
                  countryRegionIso2: 'GB'
                },
                confidence: 'High',
                entityType: 'PopulatedPlace',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [
                      51.14772797,
                      0.87279475
                    ],
                    calculationMethod: 'Rooftop',
                    usageTypes: [
                      'Display'
                    ]
                  }
                ],
                matchCodes: [
                  'Good'
                ]
              }
            ]
          }
        ],
        statusCode: 200,
        statusDescription: 'OK',
        traceId: '8e730b29a377433eb4b5f7a0ede6810b|DU00000B74|7.7.0.0|Ref A: BB9C9D05115F48BDA6C70C0A40AB8304 Ref B: DB3EDGE1510 Ref C: 2019-07-31T14:43:28Z'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const result = await location.find('Preston').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result).to.be.a.array()
    Code.expect(result.length).to.be.equal(1)
    Code.expect(result[0].name).to.equal('Ashford, Kent')
    // Test that bounding box for location has been given 2km buffer
    Code.expect(result[0].bbox2k).to.equal(JSON.parse('[0.80935719234919,51.106071366450024,0.9551791288139874,51.19515238842755]'))

    // Test that bounding box for location has been given 10km buffer
    Code.expect(result[0].bbox10k).to.equal(JSON.parse('[0.6945958802395501,51.034125753112406,1.0699404409236273,51.267098001671634]'))
  })

  lab.test('Check for Bing call returning low confidence and hence no results', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials 2',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 2019 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        resourceSets: [
          {
            estimatedTotal: 1,
            resources: [
              {
                __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                bbox: [49.957805633544922, -18.279674530029297, 60.782192230224609, 12.539674758911133],
                name: 'United Kingdom',
                point: { type: 'Point', coordinates: [53.9438362121582, -2.5505640506744385] },
                address: {
                  countryRegion: 'United Kingdom',
                  formattedAddress: 'United Kingdom',
                  countryRegionIso2: 'GB'
                },
                confidence: 'Low',
                entityType: 'CountryRegion',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [53.9438362121582, -2.5505640506744385],
                    calculationMethod: 'Rooftop',
                    usageTypes: ['Display']
                  }
                ],
                matchCodes: ['UpHierarchy']
              }
            ]
          }
        ],
        statusCode: 200,
        statusDescription: 'OK',
        traceId: '8e730b29a377433eb4b5f7a0ede6810b|DU00000B74|7.7.0.0|Ref A: BB9C9D05115F48BDA6C70C0A40AB8304 Ref B: DB3EDGE1510 Ref C: 2019-07-31T14:43:28Z'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const result = await location.find('Preston').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result).to.be.a.array()
    Code.expect(result.length).to.equal(0)
  })

  lab.test('Check for Bing call returning medium confidence results', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 2022 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        resourceSets: [
          {
            estimatedTotal: 1,
            resources: [
              {
                __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                bbox: [
                  54.019561767578125,
                  -1.556141972541809,
                  54.04982376098633,
                  -1.5211490392684937
                ],
                name: 'Nidd, Harrogate, North Yorkshire',
                point: {
                  type: 'Point',
                  coordinates: [
                    54.04291534,
                    -1.54233003
                  ]
                },
                address: {
                  adminDistrict: 'England',
                  adminDistrict2: 'North Yorkshire',
                  countryRegion: 'United Kingdom',
                  formattedAddress: 'Nidd, Harrogate, North Yorkshire',
                  locality: 'Nidd',
                  countryRegionIso2: 'GB'
                },
                confidence: 'Medium',
                entityType: 'PopulatedPlace',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [
                      54.04291534,
                      -1.54233003
                    ],
                    calculationMethod: 'Rooftop',
                    usageTypes: [
                      'Display'
                    ]
                  }
                ],
                matchCodes: [
                  'Ambiguous'
                ]
              }
            ]
          }
        ],
        statusCode: 200,
        statusDescription: 'OK',
        traceId: '36507ee29c7c448c98f9344f8bbfe030|DU0000277E|0.0.0.1|Ref A: A77983DF3F5F4371AC92EF5FA9C8BC51 Ref B: DB3EDGE2507 Ref C: 2022-10-17T15:29:57Z'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const [result] = await location.find('Preston').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result.name).to.equal('Nidd, Harrogate, North Yorkshire')
  })

  lab.test('Check for Bing call returning no data resources and hence no results', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials 4',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 2019 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        resourceSets: [
          {
            estimatedTotal: 0,
            resources: []
          }
        ],
        statusCode: 200,
        statusDescription: 'OK',
        traceId: '8e730b29a377433eb4b5f7a0ede6810b|DU00000B74|7.7.0.0|Ref A: BB9C9D05115F48BDA6C70C0A40AB8304 Ref B: DB3EDGE1510 Ref C: 2019-07-31T14:43:28Z'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const result = await location.find('Preston').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result.length).to.equal(0)
  })
  lab.test('Check for Bing call returning null response', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => { }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const result = await location.find('Preston').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result.name).to.equal('LocationSearchError')
    Code.expect(result.message).to.equal('Missing or corrupt contents from location search')
  })

  lab.test('Check for Bing call returning invalid query', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials 5',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 201 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        errorDetails: [
          'One or more parameters are not valid.',
          'query: This parameter is missing or invalid.'
        ],
        resourceSets: [],
        statusCode: 400,
        statusDescription: 'Bad Request',
        traceId: '909b39c32124486fa830b95324d23d79|DU00000D6B|7.7.0.0'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const rejects = async () => {
      await location.find('').then((resolvedValue) => {
        return resolvedValue
      })
    }

    const result = await Code.expect(rejects()).to.reject()
    Code.expect(result.name).to.equal('LocationSearchError')
    Code.expect(result.message).to.equal('Location search returned status: 400, message: Bad Request')
  })
  lab.test('Check for Bing call returning invalid query with no status code returned', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials 5',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 201 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        errorDetails: [
          'One or more parameters are not valid.',
          'query: This parameter is missing or invalid.'
        ],
        resourceSets: [],
        traceId: '909b39c32124486fa830b95324d23d79|DU00000D6B|7.7.0.0'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const rejects = async () => {
      await location.find('').then((resolvedValue) => {
        return resolvedValue
      })
    }

    const result = await Code.expect(rejects()).to.reject()
    Code.expect(result.name).to.equal('LocationSearchError')
    Code.expect(result.message).to.equal('Location search returned status: unknown, message: not set')
  })
  lab.test('Invalid data returned from third party location search', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {}

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)

    const location = require('../../server/services/location')

    const rejects = async () => {
      await location.find()
    }

    const result = await Code.expect(rejects()).to.reject()

    Code.expect(result.name).to.equal('LocationSearchError')
    Code.expect(result.message).to.equal('Missing or corrupt contents from location search')
  })
  lab.test('Check for Bing call returning null value', async () => {
    const util = require('../../server/util')

    const fakeLocationData = () => {
      return null
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const rejects = async () => {
      await location.find('').then((resolvedValue) => {
        return resolvedValue
      })
    }

    const result = await Code.expect(rejects()).to.reject()
    Code.expect(result.name).to.equal('LocationSearchError')
    Code.expect(result.message).to.equal('Missing or corrupt contents from location search')
  })
  lab.test('Check for location outside of the UK', async () => {
    const util = require('../../server/util')

    const isEngland = () => {
      return { is_england: false }
    }

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 2020 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        resourceSets: [
          {
            estimatedTotal: 1,
            resources: [
              {
                __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                bbox: [
                  53.30989,
                  -6.28652,
                  53.31206,
                  -6.2853
                ],
                name: 'Terenure Park, Dublin, County Dublin, D6W, Ireland',
                point: {
                  type: 'Point',
                  coordinates: [
                    53.31098,
                    -6.28593
                  ]
                },
                address: {
                  addressLine: 'Terenure Park',
                  adminDistrict: 'County Dublin',
                  countryRegion: 'Ireland',
                  formattedAddress: 'Terenure Park, Dublin, County Dublin, D6W, Ireland',
                  locality: 'Dublin',
                  postalCode: 'D6W',
                  countryRegionIso2: 'IE'
                },
                confidence: 'High',
                entityType: 'PopulatedPlace',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [
                      53.31098,
                      -6.28593
                    ],
                    calculationMethod: 'Interpolation',
                    usageTypes: [
                      'Display'
                    ]
                  },
                  {
                    type: 'Point',
                    coordinates: [
                      53.31098,
                      -6.28593
                    ],
                    calculationMethod: 'Interpolation',
                    usageTypes: [
                      'Route'
                    ]
                  }
                ],
                matchCodes: [
                  'Good'
                ]
              }
            ]
          }
        ],
        statusCode: 200,
        statusDescription: 'OK',
        traceId: 'd330f134370d45208e97f7f9f7e41e11|DU00000D63|0.0.0.1|Ref A: 3D3CBEC2539A43AF8DFA27D094D509F0 Ref B: DB3EDGE0809 Ref C: 2020-08-03T12:34:03Z'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const [result] = await location.find('Terenure').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result).to.be.a.object()
    Code.expect(result.name).to.equal('Terenure Park, Dublin, County Dublin, D6W, Ireland')
    Code.expect(result.isUK).to.equal(false)
    Code.expect(result.isScotlandOrNorthernIreland).to.equal(false)
  })
  lab.test('Check for location outside of England but in the UK', async () => {
    const util = require('../../server/util')

    const isEngland = () => {
      return { is_england: false }
    }

    const fakeLocationData = () => {
      return {
        authenticationResultCode: 'ValidCredentials',
        brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
        copyright: 'Copyright © 2020 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
        resourceSets: [
          {
            estimatedTotal: 2,
            resources: [
              {
                __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                bbox: [
                  54.14351,
                  -6.36584,
                  54.21084,
                  -6.30529
                ],
                name: 'Newry, Newry and Mourne',
                point: {
                  type: 'Point',
                  coordinates: [
                    54.1769,
                    -6.34155
                  ]
                },
                address: {
                  adminDistrict: 'Northern Ireland',
                  adminDistrict2: 'Newry and Mourne',
                  countryRegion: 'United Kingdom',
                  formattedAddress: 'Newry, Newry and Mourne',
                  locality: 'Newry',
                  countryRegionIso2: 'GB'
                },
                confidence: 'High',
                entityType: 'PopulatedPlace',
                geocodePoints: [
                  {
                    type: 'Point',
                    coordinates: [
                      54.1769,
                      -6.34155
                    ],
                    calculationMethod: 'Rooftop',
                    usageTypes: [
                      'Display'
                    ]
                  }
                ],
                matchCodes: [
                  'Ambiguous'
                ]
              }
            ]
          }
        ],
        statusCode: 200,
        statusDescription: 'OK',
        traceId: '97ff62188a0745baa8d8d7c5ad6ba6e7|DU00000D5B|0.0.0.1|Ref A: BE25EF947E7A481FB1BF54E82C0D3AC3 Ref B: DB3EDGE0908 Ref C: 2020-08-03T13:04:29Z'
      }
    }

    sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
    sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

    const location = require('../../server/services/location')

    const [result] = await location.find('newry').then((resolvedValue) => {
      return resolvedValue
    }, (error) => {
      return error
    })

    Code.expect(result).to.be.a.object()
    Code.expect(result.name).to.equal('Newry, Newry and Mourne')
    Code.expect(result.isUK).to.equal(true)
    Code.expect(result.isScotlandOrNorthernIreland).to.equal(true)
  })
  lab.experiment('Location name', () => {
    lab.test('Should be bing name when the location is of type PopulatedPlace', async () => {
      const util = require('../../server/util')

      const fakeLocationData = () => {
        return {
          authenticationResultCode: 'ValidCredentials',
          brandLogoUri: 'http://dev.virtualearth.net/Branding/logo_powered_by.png',
          copyright: 'Copyright © 2022 Microsoft and its suppliers. All rights reserved. This API cannot be accessed and the content and any results may not be used, reproduced or transmitted in any manner without express written permission from Microsoft Corporation.',
          resourceSets: [
            {
              estimatedTotal: 1,
              resources: [
                {
                  __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
                  bbox: [
                    54.019561767578125,
                    -1.556141972541809,
                    54.04982376098633,
                    -1.5211490392684937
                  ],
                  name: 'Nidd, Harrogate, North Yorkshire',
                  point: {
                    type: 'Point',
                    coordinates: [
                      54.04291534,
                      -1.54233003
                    ]
                  },
                  address: {
                    adminDistrict: 'England',
                    adminDistrict2: 'North Yorkshire',
                    countryRegion: 'United Kingdom',
                    formattedAddress: 'Nidd, Harrogate, North Yorkshire',
                    locality: 'Nidd',
                    countryRegionIso2: 'GB'
                  },
                  confidence: 'High',
                  entityType: 'PopulatedPlace',
                  geocodePoints: [
                    {
                      type: 'Point',
                      coordinates: [
                        54.04291534,
                        -1.54233003
                      ],
                      calculationMethod: 'Rooftop',
                      usageTypes: [
                        'Display'
                      ]
                    }
                  ],
                  matchCodes: [
                    'Ambiguous'
                  ]
                }
              ]
            }
          ],
          statusCode: 200,
          statusDescription: 'OK',
          traceId: '36507ee29c7c448c98f9344f8bbfe030|DU0000277E|0.0.0.1|Ref A: A77983DF3F5F4371AC92EF5FA9C8BC51 Ref B: DB3EDGE2507 Ref C: 2022-10-17T15:29:57Z'
        }
      }

      sandbox.stub(util, 'getJson').callsFake(fakeLocationData)
      sandbox.stub(floodService, 'getIsEngland').callsFake(isEngland)

      const location = require('../../server/services/location')

      const [result] = await location.find('').then((resolvedValue) => {
        return resolvedValue
      }, (error) => {
        return error
      })

      Code.expect(result).to.be.a.object()
      Code.expect(result.Error).to.be.undefined()
      // TODO: determine if we need both name and address
      Code.expect(result.name).to.equal('Nidd, Harrogate, North Yorkshire')
    })
  })
})
