const getAvailability = require('@defra/flood-webchat')

const webchatConfig = {
  clientId: process.env.CXONE_CLIENT_ID,
  clientSecret: process.env.CXONE_CLIENT_SECRET,
  accessKey: process.env.CXONE_ACCESS_KEY,
  accessSecret: process.env.CXONE_ACCESS_SECRET,
  skillEndpoint: process.env.CXONE_SKILL_ENDPOINT,
  hoursEndpoint: process.env.CXONE_HOURS_ENDPOINT,
  maxQueueCount: process.env.CXONE_MAX_QUEUE_COUNT
}

exports.getAvailability = () => getAvailability(webchatConfig)
