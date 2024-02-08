function flushAppRequireCache () {
  // This is a bit hacky but needed when stubbing dependancies of dependancies
  // an example would be the config module where it is a dependancy of a model
  // which is a dependancy of a route
  //
  // There are almost certainly better ways of structuring the codebase and
  // writing the tests to remove the need to do this
  Object.keys(require.cache)
    // We only want to remove local modules otherwise stuff breaks
    .filter(key => !key.includes('node_modules'))
    // We only want to remove local modules in the dependency chain described above
    // otherwise some of the tests fail for obscure reasons (e.g. instanceOf fails
    // to recognise a locally defined existing type such as LocationSearchError)
    // the 3 types in the regex are the minimum to get all tests passing
    .filter(key => /(model|route|service)/.test(key))
    .forEach(key => { delete require.cache[key] })
}

module.exports = flushAppRequireCache
