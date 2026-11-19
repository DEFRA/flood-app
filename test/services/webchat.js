'use strict'

describe('Service - Webchat', () => {
  it('should get availability using the webchat config', async () => {
    const getAvailability = jest.fn().mockResolvedValue({ available: true })
    let webchatService
    let config

    jest.isolateModules(() => {
      jest.doMock('@defra/flood-webchat', () => getAvailability)
      config = require('../../server/config')
      webchatService = require('../../server/services/webchat')
    })

    const result = await webchatService.getAvailability()

    expect(result).toEqual({ available: true })
    expect(getAvailability).toHaveBeenCalledExactlyOnceWith(config.webchat)
  })
})
