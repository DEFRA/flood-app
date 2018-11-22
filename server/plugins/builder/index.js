const path = require('path')
const config = require('../../config')
const { getState, mergeState } = require('../../db')
const dataFilePath = path.join(__dirname, '../../flood.json')
const data = require(dataFilePath)
const relativeTo = __dirname
const Model = require('./model')

data.conditions = []

const model = new Model(data, {
  getState,
  mergeState,
  relativeTo
})

const plugins = [{
  plugin: require('digital-form-builder-engine'),
  options: { model, ordnanceSurveyKey: config.ordnanceSurveyKey }
}]

// Register the designer plugin if 'dev'
if (config.isDev) {
  plugins.push({
    plugin: require('digital-form-builder-designer'),
    options: { path: dataFilePath }
  })
}

module.exports = plugins
