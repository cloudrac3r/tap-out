const result = function (line) {
  let m = line.split(' ').filter(function (item) {
    // Remove blank spaces
    return item !== ''
  })

  return {
    type: 'result',
    raw: line,
    name: m[1],
    count: m[2],
  }
}

result.equals = function (line) {
  let p = new RegExp('(#)(\\s+)((?:[a-z][a-z]+))(\\s+)(\\d+)', ['i'])

  return p.test(line)
}

module.exports = result
