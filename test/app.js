const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /health', (t) => {
  request(app)
    .get('/health')
    .expect(200, { status: 'ok' }, (err) => t.end(err))
})

test('GET /?_delay=500 delays response', (t) => {
  const start = Date.now()
  request(app)
    .get('/posts?_delay=500')
    .expect(200, (err) => {
      const elapsed = Date.now() - start
      t.error(err)
      t.ok(elapsed >= 500, `expected delay >= 500ms, got ${elapsed}ms`)
      t.end()
    })
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
