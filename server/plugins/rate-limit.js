const config = require('../config')

const rateLimit =
{
  plugin: require('hapi-rate-limit'),
  options: {
    enabled: false, // Set to 'false' if enabled on a per-route basis
    userLimit: config.rateLimitRequests,
    userCache: {
      expiresIn: config.rateLimitExpiresIn * 1000 // Expiry time in seconds
    },
    pathLimit: false,
    trustProxy: true,
    ipWhitelist: config.rateLimitWhitelist
  }
}

if (!config.localCache) {
  rateLimit.options.userCache.cache = 'redis_cache'
}

module.exports = rateLimit
