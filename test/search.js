const test = require('tape')
const search = require('../src/search')

const { _valueMatches, _recordMatches, _collectionName, _NO_RESULTS_ID } = search

// --- Minimal fakes ---------------------------------------------------------

// Mimics the slice of lowdb used by the middleware: db.get(name).value().
function fakeDb (state) {
  return {
    get (name) {
      return { value: () => state[name] }
    }
  }
}

// Runs the middleware synchronously and reports whether next() was called.
function run (db, req) {
  let called = false
  search(db)(req, {}, () => { called = true })
  return called
}

const DATA = {
  posts: [
    { id: 1, title: 'sunt aut facere', body: 'quia et suscipit', userId: 1 },
    { id: 2, title: 'qui est esse', body: 'est rerum tempore facere', userId: 1 },
    { id: 3, title: 'FACERE upper', body: 'nothing here', userId: 2 }
  ],
  users: [
    { id: 1, name: 'Leanne', address: { city: 'Gwenborough', geo: { lat: '-37' } } },
    { id: 2, name: 'Ervin', address: { city: 'Wisokyburgh', geo: { lat: '-43' } } }
  ]
}

// --- valueMatches ----------------------------------------------------------

test('valueMatches: substring match on strings', (t) => {
  t.ok(_valueMatches('hello world', 'world', false))
  t.notOk(_valueMatches('hello world', 'planet', false))
  t.end()
})

test('valueMatches: coerces numbers to strings', (t) => {
  t.ok(_valueMatches(12345, '234', false))
  t.notOk(_valueMatches(12345, '999', false))
  t.end()
})

test('valueMatches: null and undefined never match', (t) => {
  t.notOk(_valueMatches(null, 'x', false))
  t.notOk(_valueMatches(undefined, 'x', false))
  t.end()
})

test('valueMatches: recurses into nested objects and arrays', (t) => {
  t.ok(_valueMatches({ a: { b: 'deep value' } }, 'deep', false))
  t.ok(_valueMatches(['one', 'two', 'three'], 'two', false))
  t.notOk(_valueMatches({ a: { b: 'value' } }, 'missing', false))
  t.end()
})

test('valueMatches: honours case sensitivity flag', (t) => {
  // Caller lower-cases both sides when insensitive; here we pass a lower term.
  t.ok(_valueMatches('FACERE', 'facere', false), 'insensitive: haystack lowered')
  t.notOk(_valueMatches('FACERE', 'facere', true), 'sensitive: no match')
  t.ok(_valueMatches('FACERE', 'FACERE', true), 'sensitive: exact case matches')
  t.end()
})

// --- recordMatches ---------------------------------------------------------

const rec = DATA.posts[1] // { title: 'qui est esse', body: 'est rerum tempore facere' }

test('recordMatches: AND requires every term', (t) => {
  t.ok(_recordMatches(rec, ['est', 'facere'], null, 'and', false), 'both present')
  t.notOk(_recordMatches(rec, ['est', 'missing'], null, 'and', false), 'one missing')
  t.end()
})

test('recordMatches: OR requires any term', (t) => {
  t.ok(_recordMatches(rec, ['missing', 'facere'], null, 'or', false))
  t.notOk(_recordMatches(rec, ['missing', 'nope'], null, 'or', false))
  t.end()
})

test('recordMatches: AND can match across different fields', (t) => {
  // 'qui' is in title, 'facere' is in body — AND should still match.
  t.ok(_recordMatches(rec, ['qui', 'facere'], null, 'and', false))
  t.end()
})

test('recordMatches: field scoping limits which fields are searched', (t) => {
  t.ok(_recordMatches(rec, ['qui'], ['title'], 'and', false), 'in scoped field')
  t.notOk(_recordMatches(rec, ['facere'], ['title'], 'and', false), 'outside scoped field')
  t.end()
})

// --- collectionName --------------------------------------------------------

test('collectionName: extracts a single path segment', (t) => {
  t.equal(_collectionName('/posts'), 'posts')
  t.equal(_collectionName('/posts/'), 'posts')
  t.end()
})

test('collectionName: rejects resource and root paths', (t) => {
  t.equal(_collectionName('/posts/1'), null, 'single resource')
  t.equal(_collectionName('/'), null, 'root')
  t.equal(_collectionName('/posts/1/comments'), null, 'nested')
  t.end()
})

// --- middleware behaviour --------------------------------------------------

const db = fakeDb(DATA)

test('middleware: passes through when there is no q', (t) => {
  const req = { method: 'GET', path: '/posts', query: {} }
  t.ok(run(db, req))
  t.equal(req.query.id, undefined, 'no id filter injected')
  t.end()
})

test('middleware: passes through for non-GET requests', (t) => {
  const req = { method: 'POST', path: '/posts', query: { q: 'sunt' } }
  run(db, req)
  t.equal(req.query.q, 'sunt', 'q left untouched for POST')
  t.end()
})

test('middleware: ignores single-resource routes', (t) => {
  const req = { method: 'GET', path: '/posts/1', query: { q: 'sunt' } }
  run(db, req)
  t.equal(req.query.q, 'sunt', 'q untouched for /posts/1')
  t.end()
})

test('middleware: passes through for unknown collections', (t) => {
  const req = { method: 'GET', path: '/widgets', query: { q: 'sunt' } }
  t.ok(run(db, req))
  t.end()
})

test('middleware: injects matching ids and consumes search params', (t) => {
  const req = {
    method: 'GET',
    path: '/posts',
    query: { q: 'facere', q_op: 'or', q_case: '0', q_fields: 'title,body' }
  }
  run(db, req)
  t.deepEqual(req.query.id, ['1', '2', '3'], 'all posts with "facere"')
  t.equal(req.query.q, undefined, 'q consumed')
  t.equal(req.query.q_op, undefined, 'q_op consumed')
  t.equal(req.query.q_case, undefined, 'q_case consumed')
  t.equal(req.query.q_fields, undefined, 'q_fields consumed')
  t.end()
})

test('middleware: multi-term AND narrows results', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: 'sunt facere' } }
  run(db, req)
  t.deepEqual(req.query.id, ['1'], 'only post 1 has both terms')
  t.end()
})

test('middleware: q_op=or widens results', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: 'sunt esse', q_op: 'or' } }
  run(db, req)
  t.deepEqual(req.query.id, ['1', '2'], 'posts matching either term')
  t.end()
})

test('middleware: field scoping excludes non-scoped matches', (t) => {
  // "quia" only appears in post 1's body; scoping to title must exclude it.
  const req = { method: 'GET', path: '/posts', query: { q: 'quia', q_fields: 'title' } }
  run(db, req)
  t.deepEqual(req.query.id, [_NO_RESULTS_ID], 'sentinel id -> empty result')
  t.end()
})

test('middleware: case-sensitive search respects casing', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: 'FACERE', q_case: '1' } }
  run(db, req)
  t.deepEqual(req.query.id, ['3'], 'only the upper-case FACERE post')
  t.end()
})

test('middleware: no matches yields a sentinel id', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: 'zzznotfound' } }
  run(db, req)
  t.deepEqual(req.query.id, [_NO_RESULTS_ID])
  t.end()
})

test('middleware: whitespace-only q does not filter', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: '   ' } }
  run(db, req)
  t.equal(req.query.id, undefined, 'no id filter for empty query')
  t.equal(req.query.q, undefined, 'q still consumed')
  t.end()
})

test('middleware: searches nested fields deeply', (t) => {
  const req = { method: 'GET', path: '/users', query: { q: 'gwenborough' } }
  run(db, req)
  t.deepEqual(req.query.id, ['1'], 'matches nested address.city')
  t.end()
})

test('middleware: array q uses the first value', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: ['sunt', 'esse'] } }
  run(db, req)
  t.deepEqual(req.query.id, ['1'], 'uses "sunt" (first), not "esse"')
  t.end()
})

test('middleware: intersects with an existing id filter', (t) => {
  const req = { method: 'GET', path: '/posts', query: { q: 'facere', id: ['2', '3'] } }
  run(db, req)
  t.deepEqual(req.query.id, ['2', '3'], 'facere matches 1,2,3 ∩ {2,3}')
  t.end()
})
