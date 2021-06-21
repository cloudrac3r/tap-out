const types = {
  result: require('./result'),
  assert: require('./assert'),
  test: require('./test'),
  version: require('./version'),
  plan: require('./plan'),
  is: function (type, line) {
    let t = types[type]
    if (!t) {
      return false
    }
    return t.equals(line)
  },
}

module.exports = function (line) {
  if (types.is('version', line)) {
    return types.version(line)
  }
  if (types.is('result', line)) {
    return types.result(line)
  }
  if (types.is('assert', line)) {
    return types.assert(line)
  }
  if (types.is('test', line)) {
    return types.test(line)
  }
  if (types.is('plan', line)) {
    return types.plan(line)
  }
  return null
}
