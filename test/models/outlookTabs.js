'use strict'

const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const lab = exports.lab = Lab.script()
const OutlookTabsModel = require('../../server/models/outlookTabs')

lab.experiment('outlookTabs model test', () => {
  lab.test('Test OutlookTabsModel', () => {
    const outlook = {
      id: 1212,
      issued_at: '2019-11-09T15:30:00Z',
      pdf_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01212-2019-11-09_1530/fgs.pdf',
      detailed_csv_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01212-2019-11-09_1530/detailed.csv',
      area_of_concern_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01212-2019-11-09_1530/areaofconcern.jpg',
      flood_risk_trend: {
        day1: 'stable',
        day2: 'stable',
        day3: 'increasing',
        day4: 'increasing',
        day5: 'increasing'
      },
      sources: [
        {
          river: 'The river flood risk is MEDIUM today (Saturday) through to Monday and is LOW on Tuesday and Wednesday.\n\nOngoing significant river flooding impacts are expected through until Monday around the River Don, reducing to minor impacts on Tuesday and Wednesday. Minor impacts are expected elsewhere in South Yorkshire, Derbyshire, Nottinghamshire and Lincolnshire today, and on Sunday in Nottinghamshire only. Minor impacts are also possible on Sunday in Derbyshire. This is a response to previous rainfall. \n\nMinor river flooding impacts are probable over central and southern parts of England, and possible but not expected more widely across parts of England and Wales today (Saturday) and into Sunday.\n\nMinor river flooding impacts are possible over parts of South and West Yorkshire and Derbyshire from Monday to Wednesday, and are possible but not expected in other western parts of England and Wales. This is due to frequent showers falling on already saturated ground.\n'
        },
        {
          surface: 'The surface water flood risk is LOW for today (Saturday) and into Sunday.\n\nMinor surface water flooding is probable over central and southern parts of England, and possible more widely across parts of England and Wales today (Saturday) and into Sunday.\n\nMinor surface water flooding impacts are possible over parts of South and West Yorkshire and Derbyshire from Monday to Wednesday, and are possible but not expected in other western parts of England and Wales. This is due to frequent showers falling on already saturated ground.\n'
        },
        {
          ground: 'The groundwater flood risk is VERY LOW for the next five days.\n\nMinor groundwater flooding impacts are possible in Lincolnshire around the River Humber today. '
        },
        {
          coastal: 'The coastal/tidal flood risk is VERY LOW despite strong winds and large waves at times.\n'
        }
      ],
      headline: 'Ongoing significant river flooding impacts are expected in parts of South Yorkshire until Monday, with minor impacts elsewhere. The overall flood risk is MEDIUM. See end of FGS for 6-10 day forecast.',
      amendments: '',
      future_forecast: 'River and surface water flooding impacts could occur if forecast heavy rain during this period falls on already saturated catchments.',
      last_modified_at: '2019-11-09T15:06:03Z',
      next_issue_due_at: '2019-11-10T10:30:00Z',
      png_thumbnails_with_days_url: 'https://s3-eu-west-1.amazonaws.com/assets.ffc-environment-agency.fgs.metoffice.gov.uk/fgs-statements/01212-2019-11-09_1530/FGSthumbnails-with-days.png',
      risk_areas: [
        {
          id: 2426,
          statement_id: 1212,
          updated_at: '2019-11-09T12:04:15Z',
          beyond_five_days: false,
          ordering: 9,
          risk_area_blocks: [
            {
              id: 2565,
              days: [
                2
              ],
              risk_area_id: 2426,
              risk_levels: {
                river: [
                  2,
                  1
                ]
              },
              additional_information: '',
              polys: [
                {
                  id: 3306,
                  coordinates: [
                    [
                      [
                        -1.1604309082031252,
                        52.8492298820527
                      ],
                      [
                        -1.2373352050781252,
                        53.077527569052094
                      ],
                      [
                        -0.9242248535156251,
                        53.363665164191865
                      ],
                      [
                        -0.8363342285156251,
                        53.11216288766498
                      ],
                      [
                        -1.1604309082031252,
                        52.8492298820527
                      ]
                    ]
                  ],
                  area: 0.09905398927680871,
                  label_position: [],
                  poly_type: 'inland',
                  risk_area_block_id: 2565,
                  counties: [
                    {
                      name: 'Nottinghamshire'
                    },
                    {
                      name: 'Nottingham'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2425,
          statement_id: 1212,
          updated_at: '2019-11-09T12:04:15Z',
          beyond_five_days: false,
          ordering: 8,
          risk_area_blocks: [
            {
              id: 2564,
              days: [
                1
              ],
              risk_area_id: 2425,
              risk_levels: {
                ground: [
                  2,
                  2
                ]
              },
              additional_information: 'Minor groundwater flooding impacts possible around the Humber in Lincolnshire.',
              polys: [
                {
                  id: 3305,
                  coordinates: [
                    [
                      [
                        -0.6152343750000001,
                        53.66417110963306
                      ],
                      [
                        -0.8020019531250001,
                        53.54357161755108
                      ],
                      [
                        -0.42846679687500006,
                        53.57293832648609
                      ],
                      [
                        -0.32409667968750006,
                        53.657661020298
                      ],
                      [
                        -0.6152343750000001,
                        53.66417110963306
                      ]
                    ]
                  ],
                  area: 0.03245441480854367,
                  label_position: [],
                  poly_type: 'inland',
                  risk_area_block_id: 2564,
                  counties: [
                    {
                      name: 'N Lincolnshire'
                    },
                    {
                      name: 'Lincolnshire'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2424,
          statement_id: 1212,
          updated_at: '2019-11-09T12:04:15Z',
          beyond_five_days: false,
          ordering: 7,
          risk_area_blocks: [
            {
              id: 2563,
              days: [
                2
              ],
              risk_area_id: 2424,
              risk_levels: {
                river: [
                  2,
                  2
                ]
              },
              additional_information: 'Ongoing river impacts possible in Derbyshire on Sunday.',
              polys: [
                {
                  id: 3304,
                  coordinates: [
                    [
                      [
                        -1.5545654296875002,
                        52.88570596233458
                      ],
                      [
                        -1.3925170898437502,
                        52.89730555702354
                      ],
                      [
                        -1.4227294921875002,
                        53.08412692217884
                      ],
                      [
                        -1.34033203125,
                        53.258641373488096
                      ],
                      [
                        -1.6094970703125002,
                        53.261927278592474
                      ],
                      [
                        -1.7056274414062502,
                        53.366942995161345
                      ],
                      [
                        -1.8649291992187502,
                        53.420990805007634
                      ],
                      [
                        -1.9061279296875002,
                        53.283279508679094
                      ],
                      [
                        -1.7358398437500002,
                        53.10721669189343
                      ],
                      [
                        -1.68365478515625,
                        52.94367289991597
                      ],
                      [
                        -1.5545654296875002,
                        52.88570596233458
                      ]
                    ]
                  ],
                  area: 0.15716897939825025,
                  label_position: [],
                  poly_type: 'inland',
                  risk_area_block_id: 2563,
                  counties: [
                    {
                      name: 'Derby'
                    },
                    {
                      name: 'Derbyshire'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2422,
          statement_id: 1212,
          updated_at: '2019-11-09T12:04:14Z',
          beyond_five_days: false,
          ordering: 5,
          risk_area_blocks: [
            {
              id: 2561,
              days: [
                3,
                4,
                5
              ],
              risk_area_id: 2422,
              risk_levels: {
                river: [
                  2,
                  2
                ],
                surface: [
                  2,
                  2
                ]
              },
              additional_information: 'Local flooding from frequent showers starting Monday through to Wednesday.',
              polys: [
                {
                  id: 3302,
                  coordinates: [
                    [
                      [
                        -1.8676757812500002,
                        53.527247970102465
                      ],
                      [
                        -1.9390869140625002,
                        53.301338451181266
                      ],
                      [
                        -1.5985107421875,
                        53.25535521592485
                      ],
                      [
                        -1.4501953125000002,
                        53.32431151982718
                      ],
                      [
                        -1.3238525390625002,
                        53.47170048572763
                      ],
                      [
                        -1.1892700195312502,
                        53.533778184257834
                      ],
                      [
                        -1.7001342773437502,
                        53.71784098729247
                      ],
                      [
                        -2.0214843750000004,
                        53.716215632472036
                      ],
                      [
                        -1.8676757812500002,
                        53.527247970102465
                      ]
                    ]
                  ],
                  area: 0.228348152288953,
                  label_position: [],
                  poly_type: 'inland',
                  risk_area_block_id: 2561,
                  counties: [
                    {
                      name: 'W Yorkshire'
                    },
                    {
                      name: 'S Yorkshire'
                    },
                    {
                      name: 'Derbyshire'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2421,
          statement_id: 1212,
          updated_at: '2019-11-09T14:39:39Z',
          beyond_five_days: false,
          ordering: 4,
          risk_area_blocks: [
            {
              id: 2560,
              days: [
                4,
                5
              ],
              risk_area_id: 2421,
              risk_levels: {
                river: [
                  2,
                  4
                ]
              },
              additional_information: 'Ongoing impacts due to previous rainfall. ',
              polys: [
                {
                  id: 3301,
                  coordinates: [
                    [
                      [
                        -1.2194824218750002,
                        53.6185793648952
                      ],
                      [
                        -1.2208557128906252,
                        53.60391440806693
                      ],
                      [
                        -1.1618041992187502,
                        53.59658001958452
                      ],
                      [
                        -1.1412048339843752,
                        53.56559856026117
                      ],
                      [
                        -1.1343383789062502,
                        53.54683559190011
                      ],
                      [
                        -1.1762237548828127,
                        53.522349648656935
                      ],
                      [
                        -1.2400817871093752,
                        53.50356750191994
                      ],
                      [
                        -1.3114929199218752,
                        53.47905653761052
                      ],
                      [
                        -1.34857177734375,
                        53.42017241083368
                      ],
                      [
                        -1.3039398193359377,
                        53.39725097813456
                      ],
                      [
                        -1.2524414062500002,
                        53.3841474707223
                      ],
                      [
                        -1.1384582519531252,
                        53.441445540340005
                      ],
                      [
                        -1.0471343994140627,
                        53.47170048572763
                      ],
                      [
                        -0.9750366210937501,
                        53.505201062547066
                      ],
                      [
                        -0.9743499755859376,
                        53.54112347161045
                      ],
                      [
                        -0.9159851074218751,
                        53.63323922888165
                      ],
                      [
                        -1.0512542724609377,
                        53.63649628489509
                      ],
                      [
                        -1.2194824218750002,
                        53.6185793648952
                      ]
                    ]
                  ],
                  area: 0.051000586294430945,
                  label_position: [
                    -1.15368562586167,
                    53.5216034450934
                  ],
                  poly_type: 'inland',
                  risk_area_block_id: 2560,
                  counties: [
                    {
                      name: 'S Yorkshire'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2420,
          statement_id: 1212,
          updated_at: '2019-11-09T12:04:13Z',
          beyond_five_days: false,
          ordering: 3,
          risk_area_blocks: [
            {
              id: 2559,
              days: [
                1,
                2
              ],
              risk_area_id: 2420,
              risk_levels: {
                river: [
                  2,
                  1
                ],
                surface: [
                  2,
                  2
                ]
              },
              additional_information: 'Leaf fall is likely to block drains and impede drainage increasing the flood risk.',
              polys: [
                {
                  id: 3300,
                  coordinates: [
                    [
                      [
                        -2.6367187500000004,
                        53.31774904749089
                      ],
                      [
                        -3.4716796875000004,
                        53.657661020298
                      ],
                      [
                        -4.526367187500001,
                        53.527247970102465
                      ],
                      [
                        -5.075683593750001,
                        52.802761415419674
                      ],
                      [
                        -4.482421875000001,
                        52.44261787120725
                      ],
                      [
                        -5.559082031250001,
                        51.767839887322154
                      ],
                      [
                        -4.592285156250001,
                        51.20688339486562
                      ],
                      [
                        -5.888671875,
                        49.937079756975294
                      ],
                      [
                        -2.2192382812500004,
                        50.317408112618715
                      ],
                      [
                        -0.6591796875000001,
                        50.499452103967734
                      ],
                      [
                        1.2304687500000002,
                        50.819818262156545
                      ],
                      [
                        0.0,
                        51.549751017014195
                      ],
                      [
                        -0.9228515625000001,
                        52.38901106223458
                      ],
                      [
                        -2.6367187500000004,
                        53.31774904749089
                      ]
                    ]
                  ],
                  area: 14.268845370395779,
                  label_position: [
                    -2.98490084134615,
                    51.8642523785902
                  ],
                  poly_type: 'inland',
                  risk_area_block_id: 2559,
                  counties: [
                    {
                      name: 'Reading'
                    },
                    {
                      name: 'Merseyside'
                    },
                    {
                      name: 'Cornwall \u0026 Isles of Scilly'
                    },
                    {
                      name: 'Oxfordshire'
                    },
                    {
                      name: 'Leicestershire'
                    },
                    {
                      name: 'Windsor and Maidenhead'
                    },
                    {
                      name: 'Somerset'
                    },
                    {
                      name: 'Wokingham'
                    },
                    {
                      name: 'Portsmouth'
                    },
                    {
                      name: 'Surrey'
                    },
                    {
                      name: 'Gloucestershire'
                    },
                    {
                      name: 'Bournemouth'
                    },
                    {
                      name: 'Vale of Glamorgan'
                    },
                    {
                      name: 'Staffordshire'
                    },
                    {
                      name: 'N Somerset'
                    },
                    {
                      name: 'Kent'
                    },
                    {
                      name: 'Worcestershire'
                    },
                    {
                      name: 'Carmarthenshire'
                    },
                    {
                      name: 'Flintshire'
                    },
                    {
                      name: 'Hampshire'
                    },
                    {
                      name: 'Cardiff'
                    },
                    {
                      name: 'Blaenau Gwent'
                    },
                    {
                      name: 'Wrexham'
                    },
                    {
                      name: 'Newport'
                    },
                    {
                      name: 'Swindon'
                    },
                    {
                      name: 'Stoke-on-Trent'
                    },
                    {
                      name: 'Wiltshire'
                    },
                    {
                      name: 'Gtr London'
                    },
                    {
                      name: 'Rhondda Cynon Taff'
                    },
                    {
                      name: 'Ceredigion'
                    },
                    {
                      name: 'Shropshire'
                    },
                    {
                      name: 'Luton'
                    },
                    {
                      name: 'Caerphilly'
                    },
                    {
                      name: 'Herefordshire'
                    },
                    {
                      name: 'Gwynedd'
                    },
                    {
                      name: 'W Midlands'
                    },
                    {
                      name: 'Warwickshire'
                    },
                    {
                      name: 'Bracknell Forest'
                    },
                    {
                      name: 'S Gloucestershire'
                    },
                    {
                      name: 'Isle of Anglesey'
                    },
                    {
                      name: 'Devon'
                    },
                    {
                      name: 'Brighton and Hove'
                    },
                    {
                      name: 'Powys'
                    },
                    {
                      name: 'Milton Keynes'
                    },
                    {
                      name: 'Torbay'
                    },
                    {
                      name: 'Northamptonshire'
                    },
                    {
                      name: 'Monmouthshire'
                    },
                    {
                      name: 'Neath Port Talbot'
                    },
                    {
                      name: 'Derbyshire'
                    },
                    {
                      name: 'Bristol'
                    },
                    {
                      name: 'Poole'
                    },
                    {
                      name: 'Denbighshire'
                    },
                    {
                      name: 'Isle of Wight'
                    },
                    {
                      name: 'Buckinghamshire'
                    },
                    {
                      name: 'Plymouth'
                    },
                    {
                      name: 'Bath and NE Somerset'
                    },
                    {
                      name: 'Hertfordshire'
                    },
                    {
                      name: 'Pembrokeshire'
                    },
                    {
                      name: 'Southampton'
                    },
                    {
                      name: 'Telford and Wrekin'
                    },
                    {
                      name: 'Merthyr Tydfil'
                    },
                    {
                      name: 'Halton'
                    },
                    {
                      name: 'Bridgend'
                    },
                    {
                      name: 'Swansea'
                    },
                    {
                      name: 'W Sussex'
                    },
                    {
                      name: 'Dorset'
                    },
                    {
                      name: 'W Berkshire'
                    },
                    {
                      name: 'E Sussex'
                    },
                    {
                      name: 'Conwy'
                    },
                    {
                      name: 'Slough'
                    },
                    {
                      name: 'Cheshire'
                    },
                    {
                      name: 'Bedfordshire'
                    },
                    {
                      name: 'Torfaen'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2419,
          statement_id: 1212,
          updated_at: '2019-11-09T12:04:13Z',
          beyond_five_days: false,
          ordering: 2,
          risk_area_blocks: [
            {
              id: 2558,
              days: [
                1,
                2
              ],
              risk_area_id: 2419,
              risk_levels: {
                river: [
                  2,
                  3
                ],
                surface: [
                  2,
                  3
                ]
              },
              additional_information: 'Leaf fall is likely to block drains and impede drainage increasing the flood risk.',
              polys: [
                {
                  id: 3299,
                  coordinates: [
                    [
                      [
                        0.010986328125,
                        51.13455469147683
                      ],
                      [
                        0.45593261718750006,
                        50.74688365485322
                      ],
                      [
                        -0.9283447265625001,
                        50.729501501474324
                      ],
                      [
                        -1.7962646484375002,
                        51.07591977545679
                      ],
                      [
                        -1.9775390625000002,
                        51.767839887322154
                      ],
                      [
                        -1.5710449218750002,
                        52.13685974852633
                      ],
                      [
                        -0.7415771484375,
                        51.890053935216926
                      ],
                      [
                        -0.31860351562500006,
                        51.62824753375085
                      ],
                      [
                        0.010986328125,
                        51.13455469147683
                      ]
                    ]
                  ],
                  area: 2.0185617424261877,
                  label_position: [
                    -0.858306884765625,
                    51.3887325910097
                  ],
                  poly_type: 'inland',
                  risk_area_block_id: 2558,
                  counties: [
                    {
                      name: 'Surrey'
                    },
                    {
                      name: 'Gloucestershire'
                    },
                    {
                      name: 'Hampshire'
                    },
                    {
                      name: 'Swindon'
                    },
                    {
                      name: 'Wiltshire'
                    },
                    {
                      name: 'Gtr London'
                    },
                    {
                      name: 'Warwickshire'
                    },
                    {
                      name: 'Bracknell Forest'
                    },
                    {
                      name: 'Brighton and Hove'
                    },
                    {
                      name: 'Northamptonshire'
                    },
                    {
                      name: 'Buckinghamshire'
                    },
                    {
                      name: 'Hertfordshire'
                    },
                    {
                      name: 'Southampton'
                    },
                    {
                      name: 'W Sussex'
                    },
                    {
                      name: 'W Berkshire'
                    },
                    {
                      name: 'E Sussex'
                    },
                    {
                      name: 'Slough'
                    },
                    {
                      name: 'Reading'
                    },
                    {
                      name: 'Oxfordshire'
                    },
                    {
                      name: 'Windsor and Maidenhead'
                    },
                    {
                      name: 'Wokingham'
                    },
                    {
                      name: 'Portsmouth'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2418,
          statement_id: 1212,
          updated_at: '2019-11-09T15:01:30Z',
          beyond_five_days: false,
          ordering: 1,
          risk_area_blocks: [
            {
              id: 2557,
              days: [
                1
              ],
              risk_area_id: 2418,
              risk_levels: {
                river: [
                  2,
                  4
                ]
              },
              additional_information: 'Continuing on Sunday in Nottinghamshire and Derbyshire only.',
              polys: [
                {
                  id: 3298,
                  coordinates: [
                    [
                      [
                        -1.68365478515625,
                        53.536226754967544
                      ],
                      [
                        -1.6513824462890627,
                        53.54928340748793
                      ],
                      [
                        -1.6300964355468752,
                        53.553362785528094
                      ],
                      [
                        -1.5806579589843752,
                        53.5753846321476
                      ],
                      [
                        -1.5037536621093752,
                        53.58679885390296
                      ],
                      [
                        -1.4096832275390627,
                        53.591689719761675
                      ],
                      [
                        -1.3053131103515627,
                        53.57089963031601
                      ],
                      [
                        -1.2510681152343752,
                        53.589244357588655
                      ],
                      [
                        -1.1920166015625002,
                        53.621837552541365
                      ],
                      [
                        -1.0299682617187502,
                        53.635682044465476
                      ],
                      [
                        -0.9461975097656251,
                        53.64056725131206
                      ],
                      [
                        -0.90911865234375,
                        53.61532092575061
                      ],
                      [
                        -0.9146118164062501,
                        53.63161060657857
                      ],
                      [
                        -0.8377075195312501,
                        53.623466552055376
                      ],
                      [
                        -0.6152343750000001,
                        53.69345406966439
                      ],
                      [
                        -0.4449462890625,
                        53.64463782485651
                      ],
                      [
                        -0.22521972656250003,
                        53.56967636543387
                      ],
                      [
                        0.09887695312500001,
                        53.38988075156031
                      ],
                      [
                        0.26916503906250006,
                        53.1368853338
                      ],
                      [
                        -0.03295898437500001,
                        52.96518371955126
                      ],
                      [
                        -0.45043945312500006,
                        52.94201777829491
                      ],
                      [
                        -0.7525634765625001,
                        53.10391891198363
                      ],
                      [
                        -0.8404541015625001,
                        52.9999093684334
                      ],
                      [
                        -0.8926391601562501,
                        52.93539665862318
                      ],
                      [
                        -0.9970092773437501,
                        52.8525471567007
                      ],
                      [
                        -1.2084960937500002,
                        52.83595824834852
                      ],
                      [
                        -1.25518798828125,
                        52.89233468225212
                      ],
                      [
                        -1.5710449218750002,
                        52.860839234299405
                      ],
                      [
                        -1.7001342773437502,
                        53.05607268392864
                      ],
                      [
                        -1.7907714843750002,
                        53.143475584594526
                      ],
                      [
                        -1.9418334960937502,
                        53.37677497506021
                      ],
                      [
                        -1.9143676757812502,
                        53.46352559911503
                      ],
                      [
                        -1.8127441406250002,
                        53.505201062547066
                      ],
                      [
                        -1.68365478515625,
                        53.536226754967544
                      ]
                    ]
                  ],
                  area: 1.2712777273747287,
                  label_position: [
                    -0.4833984375,
                    53.238920640925
                  ],
                  poly_type: 'inland',
                  risk_area_block_id: 2557,
                  counties: [
                    {
                      name: 'Nottinghamshire'
                    },
                    {
                      name: 'S Yorkshire'
                    },
                    {
                      name: 'NE Lincolnshire'
                    },
                    {
                      name: 'Derby'
                    },
                    {
                      name: 'Derbyshire'
                    },
                    {
                      name: 'N Lincolnshire'
                    },
                    {
                      name: 'Nottingham'
                    },
                    {
                      name: 'Lincolnshire'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 2417,
          statement_id: 1212,
          updated_at: '2019-11-09T15:00:11Z',
          beyond_five_days: false,
          ordering: 0,
          risk_area_blocks: [
            {
              id: 2556,
              days: [
                1,
                2,
                3
              ],
              risk_area_id: 2417,
              risk_levels: {
                river: [
                  3,
                  4
                ]
              },
              additional_information: 'Ongoing significant impacts Saturday, Sunday and Monday.',
              polys: [
                {
                  id: 3297,
                  coordinates: [
                    [
                      [
                        -0.9832763671875001,
                        53.499483324932996
                      ],
                      [
                        -0.9674835205078126,
                        53.54112347161045
                      ],
                      [
                        -0.9159851074218751,
                        53.635682044465476
                      ],
                      [
                        -1.0340881347656252,
                        53.63649628489509
                      ],
                      [
                        -1.21673583984375,
                        53.62020849015501
                      ],
                      [
                        -1.224632263183594,
                        53.60432183675507
                      ],
                      [
                        -1.1631774902343752,
                        53.595765008920814
                      ],
                      [
                        -1.138114929199219,
                        53.54683559190011
                      ],
                      [
                        -1.1733055114746096,
                        53.5229619698152
                      ],
                      [
                        -1.2254905700683596,
                        53.50703874300615
                      ],
                      [
                        -1.2541580200195312,
                        53.50050440606685
                      ],
                      [
                        -1.3054847717285158,
                        53.48579846501056
                      ],
                      [
                        -1.3396453857421875,
                        53.452895892648655
                      ],
                      [
                        -1.3461685180664065,
                        53.41689867661602
                      ],
                      [
                        -1.3092613220214846,
                        53.39950273724988
                      ],
                      [
                        -1.2661743164062502,
                        53.385990395196394
                      ],
                      [
                        -1.249351501464844,
                        53.38578562974984
                      ],
                      [
                        -1.1439514160156252,
                        53.43653730160516
                      ],
                      [
                        -0.9832763671875001,
                        53.499483324932996
                      ]
                    ]
                  ],
                  area: 0.05232215962222553,
                  label_position: [],
                  poly_type: 'inland',
                  risk_area_block_id: 2556,
                  counties: [
                    {
                      name: 'S Yorkshire'
                    }
                  ]
                }
              ]
            },
            {
              id: 2555,
              days: [],
              risk_area_id: 2417,
              risk_levels: {
                river: [
                  3,
                  4
                ]
              },
              additional_information: 'Ongoing significant impacts Saturday, Sunday and Monday.',
              polys: [
                {
                  id: 3296,
                  coordinates: [
                    [
                      [
                        -0.9832763671875001,
                        53.499483324932996
                      ],
                      [
                        -0.9674835205078126,
                        53.54112347161045
                      ],
                      [
                        -0.9159851074218751,
                        53.635682044465476
                      ],
                      [
                        -1.0340881347656252,
                        53.63649628489509
                      ],
                      [
                        -1.21673583984375,
                        53.62020849015501
                      ],
                      [
                        -1.224632263183594,
                        53.60432183675507
                      ],
                      [
                        -1.1631774902343752,
                        53.595765008920814
                      ],
                      [
                        -1.138114929199219,
                        53.54683559190011
                      ],
                      [
                        -1.1733055114746096,
                        53.5229619698152
                      ],
                      [
                        -1.2254905700683596,
                        53.50703874300615
                      ],
                      [
                        -1.2541580200195312,
                        53.50050440606685
                      ],
                      [
                        -1.3054847717285158,
                        53.48579846501056
                      ],
                      [
                        -1.3396453857421875,
                        53.452895892648655
                      ],
                      [
                        -1.3461685180664065,
                        53.41689867661602
                      ],
                      [
                        -1.3092613220214846,
                        53.39950273724988
                      ],
                      [
                        -1.2661743164062502,
                        53.385990395196394
                      ],
                      [
                        -1.249351501464844,
                        53.38578562974984
                      ],
                      [
                        -1.1439514160156252,
                        53.43653730160516
                      ],
                      [
                        -0.9832763671875001,
                        53.499483324932996
                      ]
                    ]
                  ],
                  area: 0.05232215962222553,
                  label_position: [
                    -1.18091583251953,
                    53.5096572372555
                  ],
                  poly_type: 'inland',
                  risk_area_block_id: 2555,
                  counties: [
                    {
                      name: 'S Yorkshire'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      aoc_maps: [
        {
          id: 1397,
          title: 'Specific Areas of Concern Map 3: Tuesday 12 and wednesday 13 November',
          ordering: 2,
          caption: 'See Map 2 for Monday',
          ratio: [
            {
              top_left: [
                54.2241740519664,
                -0.14505256433039906
              ]
            },
            {
              top_right: [
                54.2241740519664,
                -2.6015295507386327
              ]
            },
            {
              bottom_right: [
                52.79209653831854,
                -2.6015295507386327
              ]
            },
            {
              top_left: [
                54.2241740519664,
                -2.6015295507386327
              ]
            }
          ],
          statement_id: 1212,
          polys: [
            {
              id: 3302,
              coordinates: [
                [
                  [
                    -1.8676757812500002,
                    53.527247970102465
                  ],
                  [
                    -1.9390869140625002,
                    53.301338451181266
                  ],
                  [
                    -1.5985107421875,
                    53.25535521592485
                  ],
                  [
                    -1.4501953125000002,
                    53.32431151982718
                  ],
                  [
                    -1.3238525390625002,
                    53.47170048572763
                  ],
                  [
                    -1.1892700195312502,
                    53.533778184257834
                  ],
                  [
                    -1.7001342773437502,
                    53.71784098729247
                  ],
                  [
                    -2.0214843750000004,
                    53.716215632472036
                  ],
                  [
                    -1.8676757812500002,
                    53.527247970102465
                  ]
                ]
              ],
              area: 0.228348152288953,
              label_position: [],
              poly_type: 'inland',
              risk_area_block_id: 2561,
              counties: [
                {
                  name: 'W Yorkshire'
                },
                {
                  name: 'S Yorkshire'
                },
                {
                  name: 'Derbyshire'
                }
              ]
            },
            {
              id: 3301,
              coordinates: [
                [
                  [
                    -1.2194824218750002,
                    53.6185793648952
                  ],
                  [
                    -1.2208557128906252,
                    53.60391440806693
                  ],
                  [
                    -1.1618041992187502,
                    53.59658001958452
                  ],
                  [
                    -1.1412048339843752,
                    53.56559856026117
                  ],
                  [
                    -1.1343383789062502,
                    53.54683559190011
                  ],
                  [
                    -1.1762237548828127,
                    53.522349648656935
                  ],
                  [
                    -1.2400817871093752,
                    53.50356750191994
                  ],
                  [
                    -1.3114929199218752,
                    53.47905653761052
                  ],
                  [
                    -1.34857177734375,
                    53.42017241083368
                  ],
                  [
                    -1.3039398193359377,
                    53.39725097813456
                  ],
                  [
                    -1.2524414062500002,
                    53.3841474707223
                  ],
                  [
                    -1.1384582519531252,
                    53.441445540340005
                  ],
                  [
                    -1.0471343994140627,
                    53.47170048572763
                  ],
                  [
                    -0.9750366210937501,
                    53.505201062547066
                  ],
                  [
                    -0.9743499755859376,
                    53.54112347161045
                  ],
                  [
                    -0.9159851074218751,
                    53.63323922888165
                  ],
                  [
                    -1.0512542724609377,
                    53.63649628489509
                  ],
                  [
                    -1.2194824218750002,
                    53.6185793648952
                  ]
                ]
              ],
              area: 0.051000586294430945,
              label_position: [
                -1.15368562586167,
                53.5216034450934
              ],
              poly_type: 'inland',
              risk_area_block_id: 2560,
              counties: [
                {
                  name: 'S Yorkshire'
                }
              ]
            }
          ]
        },
        {
          id: 1396,
          title: 'Specific Areas of Concern Map 2: Monday 11 November',
          ordering: 1,
          caption: 'See Map 3 for Tuesday and Wednesday',
          ratio: [
            {
              top_left: [
                54.256275448121364,
                -0.3153406502678991
              ]
            },
            {
              top_right: [
                54.256275448121364,
                -2.771817636676133
              ]
            },
            {
              bottom_right: [
                52.82530151402811,
                -2.771817636676133
              ]
            },
            {
              top_left: [
                54.256275448121364,
                -2.771817636676133
              ]
            }
          ],
          statement_id: 1212,
          polys: [
            {
              id: 3302,
              coordinates: [
                [
                  [
                    -1.8676757812500002,
                    53.527247970102465
                  ],
                  [
                    -1.9390869140625002,
                    53.301338451181266
                  ],
                  [
                    -1.5985107421875,
                    53.25535521592485
                  ],
                  [
                    -1.4501953125000002,
                    53.32431151982718
                  ],
                  [
                    -1.3238525390625002,
                    53.47170048572763
                  ],
                  [
                    -1.1892700195312502,
                    53.533778184257834
                  ],
                  [
                    -1.7001342773437502,
                    53.71784098729247
                  ],
                  [
                    -2.0214843750000004,
                    53.716215632472036
                  ],
                  [
                    -1.8676757812500002,
                    53.527247970102465
                  ]
                ]
              ],
              area: 0.228348152288953,
              label_position: [],
              poly_type: 'inland',
              risk_area_block_id: 2561,
              counties: [
                {
                  name: 'W Yorkshire'
                },
                {
                  name: 'S Yorkshire'
                },
                {
                  name: 'Derbyshire'
                }
              ]
            },
            {
              id: 3297,
              coordinates: [
                [
                  [
                    -0.9832763671875001,
                    53.499483324932996
                  ],
                  [
                    -0.9674835205078126,
                    53.54112347161045
                  ],
                  [
                    -0.9159851074218751,
                    53.635682044465476
                  ],
                  [
                    -1.0340881347656252,
                    53.63649628489509
                  ],
                  [
                    -1.21673583984375,
                    53.62020849015501
                  ],
                  [
                    -1.224632263183594,
                    53.60432183675507
                  ],
                  [
                    -1.1631774902343752,
                    53.595765008920814
                  ],
                  [
                    -1.138114929199219,
                    53.54683559190011
                  ],
                  [
                    -1.1733055114746096,
                    53.5229619698152
                  ],
                  [
                    -1.2254905700683596,
                    53.50703874300615
                  ],
                  [
                    -1.2541580200195312,
                    53.50050440606685
                  ],
                  [
                    -1.3054847717285158,
                    53.48579846501056
                  ],
                  [
                    -1.3396453857421875,
                    53.452895892648655
                  ],
                  [
                    -1.3461685180664065,
                    53.41689867661602
                  ],
                  [
                    -1.3092613220214846,
                    53.39950273724988
                  ],
                  [
                    -1.2661743164062502,
                    53.385990395196394
                  ],
                  [
                    -1.249351501464844,
                    53.38578562974984
                  ],
                  [
                    -1.1439514160156252,
                    53.43653730160516
                  ],
                  [
                    -0.9832763671875001,
                    53.499483324932996
                  ]
                ]
              ],
              area: 0.05232215962222553,
              label_position: [],
              poly_type: 'inland',
              risk_area_block_id: 2556,
              counties: [
                {
                  name: 'S Yorkshire'
                }
              ]
            }
          ]
        },
        {
          id: 1395,
          title: 'Specific Areas of Concern Map 1: Saturday 9 and Sunday 10 November 2019',
          ordering: 0,
          caption: 'See also maps 2 and 3',
          ratio: [
            {
              top_left: [
                54.87927395267121,
                3.0892233364284043
              ]
            },
            {
              top_right: [
                54.87927395267121,
                -6.736684609204532
              ]
            },
            {
              bottom_right: [
                48.94832178941386,
                -6.736684609204532
              ]
            },
            {
              top_left: [
                54.87927395267121,
                -6.736684609204532
              ]
            }
          ],
          statement_id: 1212,
          polys: [
            {
              id: 3300,
              coordinates: [
                [
                  [
                    -2.6367187500000004,
                    53.31774904749089
                  ],
                  [
                    -3.4716796875000004,
                    53.657661020298
                  ],
                  [
                    -4.526367187500001,
                    53.527247970102465
                  ],
                  [
                    -5.075683593750001,
                    52.802761415419674
                  ],
                  [
                    -4.482421875000001,
                    52.44261787120725
                  ],
                  [
                    -5.559082031250001,
                    51.767839887322154
                  ],
                  [
                    -4.592285156250001,
                    51.20688339486562
                  ],
                  [
                    -5.888671875,
                    49.937079756975294
                  ],
                  [
                    -2.2192382812500004,
                    50.317408112618715
                  ],
                  [
                    -0.6591796875000001,
                    50.499452103967734
                  ],
                  [
                    1.2304687500000002,
                    50.819818262156545
                  ],
                  [
                    0.0,
                    51.549751017014195
                  ],
                  [
                    -0.9228515625000001,
                    52.38901106223458
                  ],
                  [
                    -2.6367187500000004,
                    53.31774904749089
                  ]
                ]
              ],
              area: 14.268845370395779,
              label_position: [
                -2.98490084134615,
                51.8642523785902
              ],
              poly_type: 'inland',
              risk_area_block_id: 2559,
              counties: [
                {
                  name: 'Reading'
                },
                {
                  name: 'Merseyside'
                },
                {
                  name: 'Cornwall \u0026 Isles of Scilly'
                },
                {
                  name: 'Oxfordshire'
                },
                {
                  name: 'Leicestershire'
                },
                {
                  name: 'Windsor and Maidenhead'
                },
                {
                  name: 'Somerset'
                },
                {
                  name: 'Wokingham'
                },
                {
                  name: 'Portsmouth'
                },
                {
                  name: 'Surrey'
                },
                {
                  name: 'Gloucestershire'
                },
                {
                  name: 'Bournemouth'
                },
                {
                  name: 'Vale of Glamorgan'
                },
                {
                  name: 'Staffordshire'
                },
                {
                  name: 'N Somerset'
                },
                {
                  name: 'Kent'
                },
                {
                  name: 'Worcestershire'
                },
                {
                  name: 'Carmarthenshire'
                },
                {
                  name: 'Flintshire'
                },
                {
                  name: 'Hampshire'
                },
                {
                  name: 'Cardiff'
                },
                {
                  name: 'Blaenau Gwent'
                },
                {
                  name: 'Wrexham'
                },
                {
                  name: 'Newport'
                },
                {
                  name: 'Swindon'
                },
                {
                  name: 'Stoke-on-Trent'
                },
                {
                  name: 'Wiltshire'
                },
                {
                  name: 'Gtr London'
                },
                {
                  name: 'Rhondda Cynon Taff'
                },
                {
                  name: 'Ceredigion'
                },
                {
                  name: 'Shropshire'
                },
                {
                  name: 'Luton'
                },
                {
                  name: 'Caerphilly'
                },
                {
                  name: 'Herefordshire'
                },
                {
                  name: 'Gwynedd'
                },
                {
                  name: 'W Midlands'
                },
                {
                  name: 'Warwickshire'
                },
                {
                  name: 'Bracknell Forest'
                },
                {
                  name: 'S Gloucestershire'
                },
                {
                  name: 'Isle of Anglesey'
                },
                {
                  name: 'Devon'
                },
                {
                  name: 'Brighton and Hove'
                },
                {
                  name: 'Powys'
                },
                {
                  name: 'Milton Keynes'
                },
                {
                  name: 'Torbay'
                },
                {
                  name: 'Northamptonshire'
                },
                {
                  name: 'Monmouthshire'
                },
                {
                  name: 'Neath Port Talbot'
                },
                {
                  name: 'Derbyshire'
                },
                {
                  name: 'Bristol'
                },
                {
                  name: 'Poole'
                },
                {
                  name: 'Denbighshire'
                },
                {
                  name: 'Isle of Wight'
                },
                {
                  name: 'Buckinghamshire'
                },
                {
                  name: 'Plymouth'
                },
                {
                  name: 'Bath and NE Somerset'
                },
                {
                  name: 'Hertfordshire'
                },
                {
                  name: 'Pembrokeshire'
                },
                {
                  name: 'Southampton'
                },
                {
                  name: 'Telford and Wrekin'
                },
                {
                  name: 'Merthyr Tydfil'
                },
                {
                  name: 'Halton'
                },
                {
                  name: 'Bridgend'
                },
                {
                  name: 'Swansea'
                },
                {
                  name: 'W Sussex'
                },
                {
                  name: 'Dorset'
                },
                {
                  name: 'W Berkshire'
                },
                {
                  name: 'E Sussex'
                },
                {
                  name: 'Conwy'
                },
                {
                  name: 'Slough'
                },
                {
                  name: 'Cheshire'
                },
                {
                  name: 'Bedfordshire'
                },
                {
                  name: 'Torfaen'
                }
              ]
            },
            {
              id: 3299,
              coordinates: [
                [
                  [
                    0.010986328125,
                    51.13455469147683
                  ],
                  [
                    0.45593261718750006,
                    50.74688365485322
                  ],
                  [
                    -0.9283447265625001,
                    50.729501501474324
                  ],
                  [
                    -1.7962646484375002,
                    51.07591977545679
                  ],
                  [
                    -1.9775390625000002,
                    51.767839887322154
                  ],
                  [
                    -1.5710449218750002,
                    52.13685974852633
                  ],
                  [
                    -0.7415771484375,
                    51.890053935216926
                  ],
                  [
                    -0.31860351562500006,
                    51.62824753375085
                  ],
                  [
                    0.010986328125,
                    51.13455469147683
                  ]
                ]
              ],
              area: 2.0185617424261877,
              label_position: [
                -0.858306884765625,
                51.3887325910097
              ],
              poly_type: 'inland',
              risk_area_block_id: 2558,
              counties: [
                {
                  name: 'Surrey'
                },
                {
                  name: 'Gloucestershire'
                },
                {
                  name: 'Hampshire'
                },
                {
                  name: 'Swindon'
                },
                {
                  name: 'Wiltshire'
                },
                {
                  name: 'Gtr London'
                },
                {
                  name: 'Warwickshire'
                },
                {
                  name: 'Bracknell Forest'
                },
                {
                  name: 'Brighton and Hove'
                },
                {
                  name: 'Northamptonshire'
                },
                {
                  name: 'Buckinghamshire'
                },
                {
                  name: 'Hertfordshire'
                },
                {
                  name: 'Southampton'
                },
                {
                  name: 'W Sussex'
                },
                {
                  name: 'W Berkshire'
                },
                {
                  name: 'E Sussex'
                },
                {
                  name: 'Slough'
                },
                {
                  name: 'Reading'
                },
                {
                  name: 'Oxfordshire'
                },
                {
                  name: 'Windsor and Maidenhead'
                },
                {
                  name: 'Wokingham'
                },
                {
                  name: 'Portsmouth'
                }
              ]
            },
            {
              id: 3298,
              coordinates: [
                [
                  [
                    -1.68365478515625,
                    53.536226754967544
                  ],
                  [
                    -1.6513824462890627,
                    53.54928340748793
                  ],
                  [
                    -1.6300964355468752,
                    53.553362785528094
                  ],
                  [
                    -1.5806579589843752,
                    53.5753846321476
                  ],
                  [
                    -1.5037536621093752,
                    53.58679885390296
                  ],
                  [
                    -1.4096832275390627,
                    53.591689719761675
                  ],
                  [
                    -1.3053131103515627,
                    53.57089963031601
                  ],
                  [
                    -1.2510681152343752,
                    53.589244357588655
                  ],
                  [
                    -1.1920166015625002,
                    53.621837552541365
                  ],
                  [
                    -1.0299682617187502,
                    53.635682044465476
                  ],
                  [
                    -0.9461975097656251,
                    53.64056725131206
                  ],
                  [
                    -0.90911865234375,
                    53.61532092575061
                  ],
                  [
                    -0.9146118164062501,
                    53.63161060657857
                  ],
                  [
                    -0.8377075195312501,
                    53.623466552055376
                  ],
                  [
                    -0.6152343750000001,
                    53.69345406966439
                  ],
                  [
                    -0.4449462890625,
                    53.64463782485651
                  ],
                  [
                    -0.22521972656250003,
                    53.56967636543387
                  ],
                  [
                    0.09887695312500001,
                    53.38988075156031
                  ],
                  [
                    0.26916503906250006,
                    53.1368853338
                  ],
                  [
                    -0.03295898437500001,
                    52.96518371955126
                  ],
                  [
                    -0.45043945312500006,
                    52.94201777829491
                  ],
                  [
                    -0.7525634765625001,
                    53.10391891198363
                  ],
                  [
                    -0.8404541015625001,
                    52.9999093684334
                  ],
                  [
                    -0.8926391601562501,
                    52.93539665862318
                  ],
                  [
                    -0.9970092773437501,
                    52.8525471567007
                  ],
                  [
                    -1.2084960937500002,
                    52.83595824834852
                  ],
                  [
                    -1.25518798828125,
                    52.89233468225212
                  ],
                  [
                    -1.5710449218750002,
                    52.860839234299405
                  ],
                  [
                    -1.7001342773437502,
                    53.05607268392864
                  ],
                  [
                    -1.7907714843750002,
                    53.143475584594526
                  ],
                  [
                    -1.9418334960937502,
                    53.37677497506021
                  ],
                  [
                    -1.9143676757812502,
                    53.46352559911503
                  ],
                  [
                    -1.8127441406250002,
                    53.505201062547066
                  ],
                  [
                    -1.68365478515625,
                    53.536226754967544
                  ]
                ]
              ],
              area: 1.2712777273747287,
              label_position: [
                -0.4833984375,
                53.238920640925
              ],
              poly_type: 'inland',
              risk_area_block_id: 2557,
              counties: [
                {
                  name: 'Nottinghamshire'
                },
                {
                  name: 'S Yorkshire'
                },
                {
                  name: 'NE Lincolnshire'
                },
                {
                  name: 'Derby'
                },
                {
                  name: 'Derbyshire'
                },
                {
                  name: 'N Lincolnshire'
                },
                {
                  name: 'Nottingham'
                },
                {
                  name: 'Lincolnshire'
                }
              ]
            },
            {
              id: 3297,
              coordinates: [
                [
                  [
                    -0.9832763671875001,
                    53.499483324932996
                  ],
                  [
                    -0.9674835205078126,
                    53.54112347161045
                  ],
                  [
                    -0.9159851074218751,
                    53.635682044465476
                  ],
                  [
                    -1.0340881347656252,
                    53.63649628489509
                  ],
                  [
                    -1.21673583984375,
                    53.62020849015501
                  ],
                  [
                    -1.224632263183594,
                    53.60432183675507
                  ],
                  [
                    -1.1631774902343752,
                    53.595765008920814
                  ],
                  [
                    -1.138114929199219,
                    53.54683559190011
                  ],
                  [
                    -1.1733055114746096,
                    53.5229619698152
                  ],
                  [
                    -1.2254905700683596,
                    53.50703874300615
                  ],
                  [
                    -1.2541580200195312,
                    53.50050440606685
                  ],
                  [
                    -1.3054847717285158,
                    53.48579846501056
                  ],
                  [
                    -1.3396453857421875,
                    53.452895892648655
                  ],
                  [
                    -1.3461685180664065,
                    53.41689867661602
                  ],
                  [
                    -1.3092613220214846,
                    53.39950273724988
                  ],
                  [
                    -1.2661743164062502,
                    53.385990395196394
                  ],
                  [
                    -1.249351501464844,
                    53.38578562974984
                  ],
                  [
                    -1.1439514160156252,
                    53.43653730160516
                  ],
                  [
                    -0.9832763671875001,
                    53.499483324932996
                  ]
                ]
              ],
              area: 0.05232215962222553,
              label_position: [],
              poly_type: 'inland',
              risk_area_block_id: 2556,
              counties: [
                {
                  name: 'S Yorkshire'
                }
              ]
            }
          ]
        }
      ],
      public_forecast: {
        id: 1212,
        english_forecast: 'Ongoing river flooding is expected in parts of South Yorkshire, Nottinghamshire, Derbyshire and Lincolnshire today (Saturday) as a result of rain that has already fallen. This is expected to continue through until Wednesday in South Yorkshire, and until Sunday in Nottinghamshire and Derbyshire. \n\nProperties will flood and there will be travel disruption. \n\nLocalised river and surface water flooding impacts are probable on Saturday and Sunday in parts of central and southern England and are possible more widely in parts of England and Wales. Localised river and surface water flooding impacts are also possible across parts of the southern Pennines and are possible but not expected more widely across parts of England and Wales on Monday, Tuesday and Wednesday. \n\nLand, roads and some properties may flood and there may be travel disruption.',
        welsh_forecast: "Mae disgwyl llifogydd parhaus mewn afonydd mewn rhannau o Dde Sir Efrog, Sir Nottingham, Sir Derby a Sir Lincoln heddiw (dydd Sadwrn) o ganlyniad i law sydd eisoes wedi cwympo. Disgwylir i hyn barhau drwodd tan ddydd Mercher yn Ne Sir Efrog, a tan ddydd Sul yn Sir Nottingham a Sir Derby.\nBydd eiddo'n gorlifo a bydd aflonyddwch teithio.\nMae effeithiau llifogydd dŵr afon a dŵr lleol yn debygol ddydd Sadwrn a dydd Sul mewn rhannau o ganol a de Lloegr ac maent yn bosibl yn ehangach mewn rhannau o Gymru a Lloegr.\nMae effeithiau llifogydd dŵr afon a dŵr lleol hefyd yn bosibl ar draws rhannau o dde'r Pennines ac maent yn bosibl ond ni ddisgwylir yn ehangach ar draws rhannau o Gymru a Lloegr ddydd Llun, Mawrth a Mercher.\nGall tir, ffyrdd a rhai eiddo orlifo ac efallai y bydd aflonyddwch teithio.",
        england_forecast: 'Service not available.',
        wales_forecast_english: 'Service not available.',
        wales_forecast_welsh: 'Service not available.',
        published_at: '2019-11-09T15:33:15Z'
      }
    }

    const place = { name: 'Manchester, Greater Manchester', center: [-2.2343759536743164, 53.480712890625], bbox2k: [-3.216968300327545, 53.11623436652925, -1.2803249596532866, 53.840428045393054], bbox10k: [-3.322971089502337, 53.05355679509522, -1.1735137703389709, 53.903467893179474], address: 'Manchester, Greater Manchester', isEngland: { is_england: true }, isUK: true, isScotlandOrNorthernIreland: false }

    const expectedOutlookOutputJson = '{"issueDate":1573313400000,"issueUTC":"2019-11-09T15:30:00Z","formattedIssueDate":"3:30pm on 9 November 2019","groupByDay":{"1":[{"riskLevel":3,"source":"river","impact":3,"likelihood":4,"day":1,"messageId":"3-i3-l4","polyId":3297},{"riskLevel":2,"source":"river","impact":2,"likelihood":4,"day":1,"messageId":"2-i2-l4","polyId":3298},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":1,"messageId":"1-i2-l2","polyId":3300}],"2":[{"riskLevel":3,"source":"river","impact":3,"likelihood":4,"day":2,"messageId":"3-i3-l4","polyId":3297},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":2,"messageId":"1-i2-l2","polyId":3300},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":2,"messageId":"1-i2-l2","polyId":3304}],"3":[{"riskLevel":3,"source":"river","impact":3,"likelihood":4,"day":3,"messageId":"3-i3-l4","polyId":3297},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":3,"messageId":"1-i2-l2","polyId":3302},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":3,"messageId":"1-i2-l2","polyId":3302}],"4":[{"riskLevel":2,"source":"river","impact":2,"likelihood":4,"day":4,"messageId":"2-i2-l4","polyId":3301},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":4,"messageId":"1-i2-l2","polyId":3302},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":4,"messageId":"1-i2-l2","polyId":3302}],"5":[{"riskLevel":2,"source":"river","impact":2,"likelihood":4,"day":5,"messageId":"2-i2-l4","polyId":3301},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":5,"messageId":"1-i2-l2","polyId":3302},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":5,"messageId":"1-i2-l2","polyId":3302}]},"groupByDayFull":{"1":[{"riskLevel":3,"source":"river","impact":3,"likelihood":4,"day":1,"messageId":"3-i3-l4","polyId":3297},{"riskLevel":2,"source":"river","impact":2,"likelihood":4,"day":1,"messageId":"2-i2-l4","polyId":3298},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":1,"messageId":"1-i2-l2","polyId":3300}],"2":[{"riskLevel":3,"source":"river","impact":3,"likelihood":4,"day":2,"messageId":"3-i3-l4","polyId":3297},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":2,"messageId":"1-i2-l2","polyId":3300},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":2,"messageId":"1-i2-l2","polyId":3304}],"3":[{"riskLevel":3,"source":"river","impact":3,"likelihood":4,"day":3,"messageId":"3-i3-l4","polyId":3297},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":3,"messageId":"1-i2-l2","polyId":3302},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":3,"messageId":"1-i2-l2","polyId":3302}],"4":[{"riskLevel":2,"source":"river","impact":2,"likelihood":4,"day":4,"messageId":"2-i2-l4","polyId":3301},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":4,"messageId":"1-i2-l2","polyId":3302},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":4,"messageId":"1-i2-l2","polyId":3302}],"5":[{"riskLevel":2,"source":"river","impact":2,"likelihood":4,"day":5,"messageId":"2-i2-l4","polyId":3301},{"riskLevel":1,"source":"surface","impact":2,"likelihood":2,"day":5,"messageId":"1-i2-l2","polyId":3302},{"riskLevel":1,"source":"river","impact":2,"likelihood":2,"day":5,"messageId":"1-i2-l2","polyId":3302}]},"groupByDayMessage":[{"3-i3-l4":["river"],"1-i2-l2":["surface"]},{"3-i3-l4":["river"],"1-i2-l2":["surface"]},{"3-i3-l4":["river"],"1-i2-l2":["surface"]},{"2-i2-l4":["river"],"1-i2-l2":["surface"]},{"2-i2-l4":["river"],"1-i2-l2":["surface"]}],"dailyRisk":["Medium","Medium","Medium","Low","Low"],"dailyRiskAsNum":[3,3,3,2,2],"trend":[null,"remains at","remains at","reduces to","remains at"],"tab1":{"3-i3-l4":["river"],"1-i2-l2":["surface"]},"tab2":{"3-i3-l4":["river"],"1-i2-l2":["surface"]},"dayName":["Saturday","Sunday","Monday","Tuesday and Wednesday","Wednesday"],"tab3":[{"3-i3-l4":["river"],"1-i2-l2":["surface"]},{"2-i2-l4":["river"],"1-i2-l2":["surface"]}],"days":[{"idx":1,"level":1,"date":"2019-11-09T15:30:00.000Z"},{"idx":2,"level":1,"date":"2019-11-10T15:30:00.000Z"},{"idx":3,"level":1,"date":"2019-11-11T15:30:00.000Z"},{"idx":4,"level":1,"date":"2019-11-12T15:30:00.000Z"},{"idx":5,"level":1,"date":"2019-11-13T15:30:00.000Z"}],"messages1":["3-i3-l4: river: Medium risk, impact significant (3), likelihood high (4).","1-i2-l2: surface: Very low risk, impact minor (2), likelihood low (2)."],"messages2":["3-i3-l4: river: Medium risk, impact significant (3), likelihood high (4).","1-i2-l2: surface: Very low risk, impact minor (2), likelihood low (2)."],"messages3":["3-i3-l4: river: Medium risk, impact significant (3), likelihood high (4).","1-i2-l2: surface: Very low risk, impact minor (2), likelihood low (2)."]}'

    const viewModel = new OutlookTabsModel(outlook, place)

    Code.expect(JSON.stringify(viewModel)).to.equal(expectedOutlookOutputJson)
  })
})
