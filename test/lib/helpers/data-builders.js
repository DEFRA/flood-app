const Joi = require('joi')

const warningBaseSchema = Joi.object({
  ta_id: Joi.number().integer().default(1),
  ta_code: Joi.string(),
  ta_name: Joi.string().default('TA #1'),
  ta_description: Joi.string().default('Description for TA'),
  situation: Joi.string().default('Danger flood possible/likely'),
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

module.exports = {
  getAlert,
  getWarning,
  getRemoved,
  getTargetArea
}
