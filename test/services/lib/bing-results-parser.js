const Lab = require('@hapi/lab')
const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = Lab.script()
const responseTemplate = require('./bing-results-template.json')

const bingResultsParser = require('../../../server/services/lib/bing-results-parser')

function getBingResponse (resources = []) {
  const response = { ...responseTemplate }
  response.resourceSets = [{
    estimatedTotal: resources.length,
    resources
  }]
  return response
}

async function checkParsedResponse (resources, stubGetEngland, expectedResult) {
  const bingResponse = getBingResponse(resources)
  const result = await bingResultsParser(bingResponse, stubGetEngland)
  expect(result).to.equal(expectedResult)
}

experiment('bingResultsParser', () => {
  experiment('english searches', () => {
    const stubGetEngland = async () => { return { is_england: true } }
    test('empty resource set should return empty results', async () => {
      const bingResponse = getBingResponse()
      const result = await bingResultsParser(bingResponse, stubGetEngland)
      expect(result).to.equal([])
    })
    test('english town location search should return populated result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            53.99038314819336,
            -1.5035173892974854,
            54.03419876098633,
            -1.4180587530136108
          ],
          name: 'Knaresborough, North Yorkshire',
          point: {
            type: 'Point',
            coordinates: [
              54.00714111,
              -1.46303844
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'North Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Knaresborough, North Yorkshire',
            locality: 'Knaresborough',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.00714111,
                -1.46303844
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

      const expectedResult = [
        {
          name: 'Knaresborough, North Yorkshire',
          slug: 'knaresborough-north-yorkshire',
          center: [-1.46303844, 54.00714111],
          bbox2k: [
            -1.534142855800849,
            53.972396744766755,
            -1.3874332865102472,
            54.05218516440792
          ],
          bbox10k: [
            -1.6566444925899468,
            53.90045113102211,
            -1.2649316497211494,
            54.12413077805586
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      checkParsedResponse(resources, stubGetEngland, expectedResult)
    })
    test('english county search should return ceremonial county (AdminDivision1) over administrative county (AdminDivision2)', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            54.7823600769043,
            -2.6897950172424316,
            55.811668395996094,
            -1.460276484489441
          ],
          name: 'Northumberland',
          point: {
            type: 'Point',
            coordinates: [
              55.24245834,
              -2.06545234
            ]
          },
          address: {
            adminDistrict: 'Northumberland',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Northumberland',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'AdminDivision1',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                55.24245834,
                -2.06545234
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
        },
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            54.7823600769043,
            -2.6897950172424316,
            55.811668395996094,
            -1.4027706384658813
          ],
          name: 'Northumberland',
          point: {
            type: 'Point',
            coordinates: [
              55.23395538,
              -2.04782939
            ]
          },
          address: {
            adminDistrict: 'Northumberland',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Northumberland',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'AdminDivision1',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                55.23395538,
                -2.04782939
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
        },
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            54.7823600769043,
            -2.6897950172424316,
            55.811676025390625,
            -1.4601497650146484
          ],
          name: 'Northumberland',
          point: {
            type: 'Point',
            coordinates: [
              55.17995834,
              -1.80139947
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'Northumberland',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Northumberland',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'AdminDivision2',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                55.17995834,
                -1.80139947
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

      const expectedResult = [
        // AdminDivision1 should take precedance over other entity types in
        // response
        {
          name: 'Northumberland',
          slug: 'northumberland',
          center: [-2.06545234, 55.24245834],
          bbox2k: [
            -2.721803715494745,
            54.7643744779302,
            -1.4282677862371271,
            55.829653988329156
          ],
          bbox10k: [
            -2.8498382313297492,
            54.692432073840145,
            -1.300233270402123,
            55.90159634910422
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      checkParsedResponse(resources, stubGetEngland, expectedResult)
    })
    test('english county search for ceremonial county should return the ceremonial county when there are no administrative counties', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            54.03961944580078,
            -3.6406314373016357,
            55.18899154663086,
            -2.1589810848236084
          ],
          name: 'Cumbria',
          point: {
            type: 'Point',
            coordinates: [
              54.57675934,
              -2.91157079
            ]
          },
          address: {
            adminDistrict: 'Cumbria',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Cumbria',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'AdminDivision1',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.57675934,
                -2.91157079
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

      // AdminDivision1 (ceremonial county)
      const expectedResult = [
        {
          name: 'Cumbria',
          slug: 'cumbria',
          center: [-2.91157079, 54.57675934],
          bbox2k: [
            -3.672137848226576,
            54.02163420058362,
            -2.127474673898669,
            55.20697678117478
          ],
          bbox10k: [
            -3.798163229693759,
            53.94969320818414,
            -2.001449292431486,
            55.278917707262806
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      checkParsedResponse(resources, stubGetEngland, expectedResult)
    })
    test('successful postcode search should return populated result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            54.005693099079714,
            -1.4739542828842274,
            54.01341853422107,
            -1.4564274920181164
          ],
          name: 'Knaresborough, HG5 0JL',
          point: {
            type: 'Point',
            coordinates: [
              54.00955582,
              -1.46519089
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'North Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Knaresborough, HG5 0JL',
            locality: 'Knaresborough',
            postalCode: 'HG5 0JL',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'Postcode1',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.00955582,
                -1.46519089
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
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      const expectedResult = [
        {
          name: 'Knaresborough, HG5 0JL',
          slug: 'hg5-0jl',
          center: [-1.46519089, 54.00955582],
          bbox2k: [
            -1.5045644526149113,
            53.9877066919671,
            -1.4258173222874324,
            54.03140494133353
          ],
          bbox10k: [
            -1.6270049027390623,
            53.91576106351499,
            -1.3033768721632815,
            54.10335056978173
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      expect(result).to.equal(expectedResult)
    })
    test('successful outcode search should return populated result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            53.964805603027344,
            -1.5241378545761108,
            54.07632064819336,
            -1.344303846359253
          ],
          name: 'Knaresborough, HG5',
          point: {
            type: 'Point',
            coordinates: [
              54.01323318,
              -1.45626473
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'North Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Knaresborough, HG5',
            locality: 'Knaresborough',
            postalCode: 'HG5',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'Postcode3',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.01323318,
                -1.45626473
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
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      const expectedResult = [
        {
          name: 'Knaresborough, HG5',
          slug: 'hg5',
          center: [-1.45626473, 54.01323318],
          bbox2k: [
            -1.554794384621328,
            53.94681921279003,
            -1.3136473163140359,
            54.09430703840006
          ],
          bbox10k: [
            -1.677420274668105,
            53.874873651672104,
            -1.1910214262672587,
            54.16625259905653
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      expect(result).to.equal(expectedResult)
    })
    test('successful address search should return empty result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            53.85298628242932,
            -1.571548389701314,
            53.86071171757067,
            -1.5540856102986857
          ],
          name: '1 The Avenue, Alwoodley, Leeds, LS17 7BD',
          point: {
            type: 'Point',
            coordinates: [
              53.856849,
              -1.562817
            ]
          },
          address: {
            addressLine: '1 The Avenue',
            adminDistrict: 'England',
            adminDistrict2: 'West Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: '1 The Avenue, Alwoodley, Leeds, LS17 7BD',
            locality: 'Leeds',
            postalCode: 'LS17 7BD',
            countryRegionIso2: 'GB'
          },
          confidence: 'Medium',
          entityType: 'Address',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                53.856849,
                -1.562817
              ],
              calculationMethod: 'Rooftop',
              usageTypes: [
                'Display'
              ]
            },
            {
              type: 'Point',
              coordinates: [
                53.8567274,
                -1.5627166
              ],
              calculationMethod: 'Rooftop',
              usageTypes: [
                'Route'
              ]
            }
          ],
          matchCodes: [
            'Ambiguous'
          ]
        }
      ]
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      expect(result).to.equal([])
    })
    test('high confidence response should return populated result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            53.99038314819336,
            -1.5035173892974854,
            54.03419876098633,
            -1.4180587530136108
          ],
          name: 'Knaresborough, North Yorkshire',
          point: {
            type: 'Point',
            coordinates: [
              54.00714111,
              -1.46303844
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'North Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Knaresborough, North Yorkshire',
            locality: 'Knaresborough',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.00714111,
                -1.46303844
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
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      const expectedResult = [
        {
          name: 'Knaresborough, North Yorkshire',
          slug: 'knaresborough-north-yorkshire',
          center: [-1.46303844, 54.00714111],
          bbox2k: [
            -1.534142855800849,
            53.972396744766755,
            -1.3874332865102472,
            54.05218516440792
          ],
          bbox10k: [
            -1.6566444925899468,
            53.90045113102211,
            -1.2649316497211494,
            54.12413077805586
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      expect(result).to.equal(expectedResult)
    })
    test('medium confidence response should return empty result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            53.99038314819336,
            -1.5035173892974854,
            54.03419876098633,
            -1.4180587530136108
          ],
          name: 'Knaresborough, North Yorkshire',
          point: {
            type: 'Point',
            coordinates: [
              54.00714111,
              -1.46303844
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'North Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Knaresborough, North Yorkshire',
            locality: 'Knaresborough',
            countryRegionIso2: 'GB'
          },
          confidence: 'Medium',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.00714111,
                -1.46303844
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
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      const expectedResult = []
      expect(result).to.equal(expectedResult)
    })
    test('low confidence response should return empty result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            53.99038314819336,
            -1.5035173892974854,
            54.03419876098633,
            -1.4180587530136108
          ],
          name: 'Knaresborough, North Yorkshire',
          point: {
            type: 'Point',
            coordinates: [
              54.00714111,
              -1.46303844
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'North Yorkshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Knaresborough, North Yorkshire',
            locality: 'Knaresborough',
            countryRegionIso2: 'GB'
          },
          confidence: 'Low',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                54.00714111,
                -1.46303844
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
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      expect(result).to.equal([])
    })
    test('multiple items in response should return the first non-low confidence result', async () => {
      // Note: we currently limit the max results returned from bing using the maxResults URL query parameter
      // to just 1
      // The results are still returned as an array with just a single entry but this test demonstrates that
      // the code works should this parameter change in the future.
      const resources = [
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
        },
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            51.02236557006836,
            -0.4873929023742676,
            51.44563293457031,
            1.0504722595214844
          ],
          name: 'Ashford, Surrey',
          point: {
            type: 'Point',
            coordinates: [
              51.43230057,
              -0.46049938
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'Surrey',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Ashford, Surrey',
            locality: 'Ashford',
            countryRegionIso2: 'GB'
          },
          confidence: 'Medium',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                51.43230057,
                -0.46049938
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
        },
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            50.89913783233948,
            -1.8659905171462143,
            50.957078598324586,
            -1.7434982085160171
          ],
          name: 'Ashford, Fordingbridge, Hampshire',
          point: {
            type: 'Point',
            coordinates: [
              50.92810822,
              -1.80474436
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'Hampshire',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Ashford, Fordingbridge, Hampshire',
            locality: 'Ashford',
            countryRegionIso2: 'GB'
          },
          confidence: 'Medium',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                50.92810822,
                -1.80474436
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
        },
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            50.9887580871582,
            0.5919979214668274,
            51.26953887939453,
            1.030938744544983
          ],
          name: 'Ashford',
          point: {
            type: 'Point',
            coordinates: [
              51.13436127,
              0.83433753
            ]
          },
          address: {
            adminDistrict: 'England',
            adminDistrict2: 'Kent',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Ashford',
            countryRegionIso2: 'GB'
          },
          confidence: 'Low',
          entityType: 'AdminDivision3',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                51.13436127,
                0.83433753
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
      const bingResponse = getBingResponse(resources)
      const result = await bingResultsParser(bingResponse, stubGetEngland)

      const expectedResult = [
        {
          name: 'Ashford, Kent',
          slug: 'ashford-kent',
          center: [0.87279475, 51.14772797],
          bbox2k: [
            0.80935719234919,
            51.106071366450024,
            0.9551791288139874,
            51.19515238842755
          ],
          bbox10k: [
            0.6945958802395501,
            51.034125753112406,
            1.0699404409236273,
            51.267098001671634
          ],
          isUK: true,
          isEngland: { is_england: true }
        }
      ]
      expect(result).to.equal(expectedResult)
    })
  })
  experiment('non-english searches', () => {
    const stubGetEngland = async () => { return { is_england: false } }
    test('scottish town location search should return empty result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            56.661529541015625,
            -2.5852043628692627,
            56.89529037475586,
            -2.2232439517974854
          ],
          name: 'Montrose, Angus',
          point: {
            type: 'Point',
            coordinates: [
              56.70924759,
              -2.46721101
            ]
          },
          address: {
            adminDistrict: 'Scotland',
            adminDistrict2: 'Angus',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Montrose, Angus',
            locality: 'Montrose',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'PopulatedPlace',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                56.70924759,
                -2.46721101
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
      const expectedResult = [
      ]
      checkParsedResponse(resources, stubGetEngland, expectedResult)
    })
    test('welsh preserved county location search should return empty result', async () => {
      const resources = [
        {
          __type: 'Location:http://schemas.microsoft.com/search/local/ws/rest/v1',
          bbox: [
            51.59596633911133,
            -5.670312404632568,
            52.562416076660156,
            -3.6471149921417236
          ],
          name: 'Dyfed',
          point: {
            type: 'Point',
            coordinates: [
              51.99719238,
              -4.3354516
            ]
          },
          address: {
            adminDistrict: 'Dyfed',
            countryRegion: 'United Kingdom',
            formattedAddress: 'Dyfed',
            countryRegionIso2: 'GB'
          },
          confidence: 'High',
          entityType: 'AdminDivision1',
          geocodePoints: [
            {
              type: 'Point',
              coordinates: [
                51.99719238,
                -4.3354516
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
      const expectedResult = [
      ]
      checkParsedResponse(resources, stubGetEngland, expectedResult)
    })
  })
})
