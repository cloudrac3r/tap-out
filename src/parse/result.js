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
  let p = new RegExp('#\\s+(tests|pass|fail|todo)\\s+\\d+\\s*$', ['i'])
  return p.test(line)
}

module.exports = result
