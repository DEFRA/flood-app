'use strict'
const getAvailability = require('@defra/flood-webchat')
const config = require('../config')

exports.getAvailability = () => getAvailability(config.webchat)
