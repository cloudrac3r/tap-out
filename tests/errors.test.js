const parser = require('../')
const test = require('tape')

test('handles HTTP error source', function (t) {
  t.plan(1)
  const mockTap = [
    'TAP version 13',
    '# is true',
    'ok 1 true value',
    'ok 2 true value',
    'not ok 3 strings match',
    '  ---',
    '    operator: equal',
    "    expected: 'you'",
    "    actual:   'me'",
    '    at: Test.<anonymous> (http://localhost:9966/index.js:8:5)',
    '  ...',
    'not ok 15 plan != count',
    '  ---',
    '    operator: fail',
    '    expected: 4',
    '    actual:   3',
    '  ...',
    '',
    '1..15',
  ]
  let p = parser()
  p.on('output', function (output) {
    let assert = output.fail[0]
    t.deepEqual(assert.error.at, { character: '5', file: 'http://localhost:9966/index.js', line: '8' })
  })
  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})

test('handles raw error string', function (t) {
  t.plan(1)
  const rawLines = [
    '    operator: deepEqual',
    '    expected:',
    '      { 0: 0, 1: 0, 10: 0, 11: 255, 12: 0, 13: 0, 14: 0, 15: 255, 2: 0, 3: 221, 4: 0, 5: 0, 6: 0, 7: 255, 8: 0, 9: 0 }',
    '    actual:',
    '      { 0: 0, 1: 0, 10: 0, 11: 255, 12: 0, 13: 0, 14: 0, 15: 255, 2: 0, 3: 255, 4: 0, 5: 0, 6: 0, 7: 255, 8: 0, 9: 0 }',
    '    at: Test.<anonymous> (http://localhost:9966/index.js:8:5)',
  ]
  let mockTap = ['TAP version 13', '# is true', 'ok 1 true value', 'ok 2 true value', 'not ok 3 arrays match', '  ---']
    .concat(rawLines)
    .concat([
      '  ...',
      'not ok 15 plan != count',
      '  ---',
      '    operator: fail',
      '    expected: 4',
      '    actual:   3',
      '  ...',
      '',
      '1..15',
    ])
  let p = parser()
  p.on('output', function (output) {
    let assert = output.fail[0]
    t.deepEqual(assert.error.raw, rawLines.join('\n'))
  })
  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})

test('handles multiline error string with |-', function (t) {
  t.plan(2)
  const mockTap = [
    'TAP version 13',
    '# is true',
    'ok 1 true value',
    'not ok 2 object deep equal with cross',
    '  ---',
    '    operator: deepEqual',
    '    expected: |-',
    '      { a: 1, b: 2 }',
    '    actual: |-',
    '      { a: 1, b: 3 }',
    '    at: Test.<anonymous> (/Users/germ/Projects/a/b/test.js:7:5)',
    '  ...',
    '',
    '1..2',
  ]
  let p = parser()
  p.on('output', function (output) {
    let assert = output.fail[0]
    t.equal(assert.error.expected, '{ a: 1, b: 2 }')
    t.equal(assert.error.actual, '{ a: 1, b: 3 }')
  })
  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})

test('handles multiline error stack with |-', function (t) {
  t.plan(2)
  const mockTap = [
    'TAP version 13',
    '# promise error',
    'not ok 1 TypeError: foo',
    '  ---',
    '    operator: error',
    '    expected: |-',
    '      undefined',
    '    actual: |-',
    '      [TypeError: foo]',
    '    at: process._tickCallback (internal/process/next_tick.js:103:7)',
    '    stack: |-',
    '      TypeError: foo',
    '          at throwError (/Users/germ/Projects/a/b/test.js:17:9)',
    '          at Promise.resolve.then (/Users/germ/Projects/a/b/test.js:24:5)',
    '          at process._tickCallback (internal/process/next_tick.js:103:7)',
    '  ...',
    '',
    '1..1',
    '# tests 1',
    '# pass  0',
    '# fail  1',
  ]
  let p = parser()
  p.on('output', function (output) {
    let assert = output.fail[0]
    t.equal(
      assert.error.stack,
      'TypeError: foo\n' +
        'at throwError (/Users/germ/Projects/a/b/test.js:17:9)\n' +
        'at Promise.resolve.then (/Users/germ/Projects/a/b/test.js:24:5)\n' +
        'at process._tickCallback (internal/process/next_tick.js:103:7)\n'
    )
    t.equal(
      assert.error.raw,
      '    operator: error\n' +
        '    expected: |-\n' +
        '      undefined\n' +
        '    actual: |-\n' +
        '      [TypeError: foo]\n' +
        '    at: process._tickCallback (internal/process/next_tick.js:103:7)\n' +
        '    stack: |-\n' +
        'TypeError: foo\n' +
        'at throwError (/Users/germ/Projects/a/b/test.js:17:9)\n' +
        'at Promise.resolve.then (/Users/germ/Projects/a/b/test.js:24:5)\n' +
        'at process._tickCallback (internal/process/next_tick.js:103:7)'
    )
  })

  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})

test('output without plan', function (t) {
  t.plan(1)
  const mockTap = ['# is true', 'ok 1 true value']
  let p = parser()
  p.on('output', function (output) {
    t.deepEqual(
      output,
      {
        asserts: [{ name: 'true value', number: 1, ok: true, raw: 'ok 1 true value', test: 1, type: 'assert' }],
        fail: [],
        pass: [{ name: 'true value', number: 1, ok: true, raw: 'ok 1 true value', test: 1, type: 'assert' }],
        results: [],
        tests: [{ name: 'is true', number: 1, raw: '# is true', type: 'test' }],
        versions: [],
        comments: [],
        plans: [],
        errors: [{ message: 'no plan provided', type: 'error' }],
      },
      'output data with empty plans and no plan provided'
    )
  })

  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})

test('output with assert count and plan mismatch', function (t) {
  t.plan(1)
  const mockTap = ['# is true', 'ok 1 true value', '1..2']
  let p = parser()
  p.on('output', function (output) {
    t.deepEqual(
      output,
      {
        asserts: [{ name: 'true value', number: 1, ok: true, raw: 'ok 1 true value', test: 1, type: 'assert' }],
        fail: [],
        pass: [{ name: 'true value', number: 1, ok: true, raw: 'ok 1 true value', test: 1, type: 'assert' }],
        results: [],
        tests: [{ name: 'is true', number: 1, raw: '# is true', type: 'test' }],
        versions: [],
        comments: [],
        plans: [{ from: 1, to: 2, raw: '1..2', skip: undefined, type: 'plan' }],
        errors: [{ message: 'incorrect number of assertions made', type: 'error' }],
      },
      'output data with empty assert count and plan mismatch error'
    )
  })
  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})

test('output with plan end and assertion number mismatch', function (t) {
  t.plan(1)
  const mockTap = ['# is true', 'ok 1 true value', 'ok 3 true value', '1..2']
  let p = parser()
  p.on('output', function (output) {
    t.deepEqual(
      output,
      {
        asserts: [
          { name: 'true value', number: 1, ok: true, raw: 'ok 1 true value', test: 1, type: 'assert' },
          { name: 'true value', number: 3, ok: true, raw: 'ok 3 true value', test: 1, type: 'assert' },
        ],
        fail: [],
        pass: [
          { name: 'true value', number: 1, ok: true, raw: 'ok 1 true value', test: 1, type: 'assert' },
          { name: 'true value', number: 3, ok: true, raw: 'ok 3 true value', test: 1, type: 'assert' },
        ],
        results: [],
        tests: [{ name: 'is true', number: 1, raw: '# is true', type: 'test' }],
        versions: [],
        comments: [],
        plans: [{ from: 1, to: 2, raw: '1..2', skip: undefined, type: 'plan' }],
        errors: [{ message: 'last assertion number does not equal the plan end', type: 'error' }],
      },
      'output data with plan end error'
    )
  })

  mockTap.forEach(function (line) {
    p.write(line + '\n')
  })
  p.end()
})
