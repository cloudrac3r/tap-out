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
module.exports = types
