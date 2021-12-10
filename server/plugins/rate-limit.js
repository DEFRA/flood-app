const config = require('../config')

const rateLimit =
{
  plugin: require('hapi-rate-limit'),
  options: {
    enabled: false, // Enabled on a per-route basis
    userPathLimit: config.rateLimitRequests,
    userPathCache: {
      expiresIn: config.rateLimitExpiresIn * 60 * 1000
    },
    pathLimit: false,
    userLimit: false,
    trustProxy: true,
    ipWhitelist: config.rateLimitWhitelist
  }
}

if (!config.localCache) {
  rateLimit.options.userPathCache.cache = 'redis_cache'
}

module.exports = rateLimit
