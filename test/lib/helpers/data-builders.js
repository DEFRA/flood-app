const Joi = require('joi')

const warningBaseSchema = Joi.object({
  ta_id: Joi.number().integer().default(1),
  ta_code: Joi.string(),
  ta_name: Joi.string().default('TA #1'),
  ta_description: Joi.string().default('Description for TA'),
  situation: Joi.allow('').default('Danger flood possible/likely'),
  situation_changed: Joi.string().default('2024-04-23T07:57:00.000Z'),
  severity_value: Joi.number().integer(),
  severity: Joi.string()
})

const targetAreaSchema = Joi.object({
  id: Joi.number().integer().default(1),
  area: Joi.string().default('Area #1'),
  name: Joi.string().default('TA #1'),
  code: Joi.string(),
  description: Joi.string().default('Description for TA'),
  parent: Joi.string(),
  centroid: Joi.string().default('{"type":"Point","coordinates":[-3.590072619,54.550316408]}')
})

const tAthresholdDataSchema = Joi.object({
  station_threshold_id: Joi.string(),
  station_id: Joi.string(),
  fwis_code: Joi.string(),
  fwis_type: Joi.string(),
  direction: Joi.string().valid('u', 'd'),
  value: Joi.number(),
  threshold_type: Joi.string(),
  river_id: Joi.string(),
  river_name: Joi.string(),
  river_qualified_name: Joi.string(),
  navigable: Joi.boolean(),
  view_rank: Joi.number().integer(),
  rank: Joi.string(),
  rloi_id: Joi.number().integer(),
  up: Joi.number().integer().allow(null),
  down: Joi.number().integer().allow(null),
  telemetry_id: Joi.string(),
  region: Joi.string(),
  catchment: Joi.string(),
  wiski_river_name: Joi.string(),
  agency_name: Joi.string(),
  external_name: Joi.string(),
  station_type: Joi.string(),
  status: Joi.string().valid('Active', 'Inactive'),
  qualifier: Joi.string(),
  iswales: Joi.boolean(),
  value_timestamp: Joi.date().iso(),
  value_erred: Joi.boolean().required(),
  trend: Joi.string().valid('steady', 'rising', 'falling'),
  percentile_5: Joi.number(),
  percentile_95: Joi.number(),
  centroid: Joi.string(),
  lon: Joi.number(),
  lat: Joi.number(),
  day_total: Joi.number().allow(null),
  six_hr_total: Joi.number().allow(null),
  one_hr_total: Joi.number().allow(null),
  id: Joi.string(),
  threshold_value: Joi.number(),
  latest_level: Joi.number()
})

function validateAgainstSchema (schema, values) {
  const { error, value } = schema.validate(values)

  if (error) {
    throw new Error(error)
  }

  return value
}

function getWarning (values) {
  return validateAgainstSchema(
    warningBaseSchema,
    { severity_value: 2, severity: 'Flood warning', ...values }
  )
}

function getAlert (values) {
  return validateAgainstSchema(
    warningBaseSchema,
    { severity_value: 1, severity: 'Flood alert', ...values }
  )
}

function getRemoved (values) {
  return validateAgainstSchema(
    warningBaseSchema,
    { severity_value: 4, severity: 'Flood warning removed', ...values }
  )
}

function getTargetArea (values) {
  return validateAgainstSchema(targetAreaSchema, values)
}

function getTargetAreaThresholds (values) {
  return validateAgainstSchema(tAthresholdDataSchema, ...values)
}

module.exports = {
  getAlert,
  getWarning,
  getRemoved,
  getTargetArea,
  getTargetAreaThresholds
}
