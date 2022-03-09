const config = require('../config')

const rateLimit =
{
  plugin: require('hapi-rate-limit'),
  options: {
    enabled: false, // Set to 'false' if enabled on a per-route basis
    userPathLimit: config.rateLimitRequests,
    userPathCache: {
      expiresIn: config.rateLimitExpiresIn * 1000 // Expiry time in seconds
    },
    userLimit: false,
    trustProxy: true,
    ipWhitelist: config.rateLimitWhitelist
  }
}

if (!config.localCache) {
  rateLimit.options.userPathCache.cache = 'redis_cache'
}

module.exports = rateLimit
