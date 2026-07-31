const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('POST /', (t) => {
  const max = 10
  t.plan(max * 3)

  // Test concurrency
  for (var i = 0; i < max; i++) {
    request(app)
      .post('/posts')
      .send({ body: 'foo' })
      .expect(201, (err) => {
        t.error(err)
        // Check that GET /posts length still returns 100 items
        request(app)
          .get('/posts')
          .expect(200, (err, res) => {
            t.error(err)
            const { length } = res.body
            t.equal(
              length,
              100,
              `more than 100 posts found (${length})`
            )
          })
      })
  }
})

test('GET /posts?_delay=200 waits before responding and does not affect results', (t) => {
  const start = Date.now()
  request(app)
    .get('/posts?_delay=200')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(Date.now() - start >= 200, 'response should be delayed by at least 200ms')
      t.equal(res.body.length, 100, '_delay must not leak through as a field filter')
      t.end()
    })
})

test('GET /posts with X-Delay header waits before responding', (t) => {
  const start = Date.now()
  request(app)
    .get('/posts')
    .set('X-Delay', '150')
    .expect(200, (err) => {
      t.error(err)
      t.ok(Date.now() - start >= 150, 'response should be delayed by at least 150ms')
      t.end()
    })
})

test('_delay is capped at maxDelayMs', (t) => {
  const parseDelay = app.get('parseDelay')
  const maxDelayMs = app.get('maxDelayMs')
  const req = { query: { _delay: String(maxDelayMs + 5000) }, get: () => undefined }
  t.equal(parseDelay(req), maxDelayMs, 'delay above the cap is clamped')
  t.end()
})

test('invalid or missing _delay is treated as no delay', (t) => {
  const parseDelay = app.get('parseDelay')
  t.equal(parseDelay({ query: {}, get: () => undefined }), 0, 'missing _delay')
  t.equal(parseDelay({ query: { _delay: 'not-a-number' }, get: () => undefined }), 0, 'non-numeric _delay')
  t.equal(parseDelay({ query: { _delay: '-50' }, get: () => undefined }), 0, 'negative _delay')
  t.end()
})
