const config = require('../config')

const rateLimit =
{
  plugin: require('hapi-rate-limit'),
  options: {
    enabled: true, // Set to 'false' if enabled on a per-route basis
    // userPathLimit: config.rateLimitRequests,
    // userPathCache: {
    //   expiresIn: config.rateLimitExpiresIn * 1000 // Expiry time in seconds
    // },
    userPathLimit: false,
    pathLimit: false,
    userLimit: config.rateLimitRequests,
    userCache: {
      expiresIn: config.rateLimitExpiresIn * 1000 // Expiry time in seconds
    },
    // userLimit: false,
    trustProxy: true,
    ipWhitelist: config.rateLimitWhitelist
  }
}

if (!config.localCache) {
  // rateLimit.options.userPathCache.cache = 'redis_cache'
  rateLimit.options.userCache.cache = 'redis_cache'
}

module.exports = rateLimit
