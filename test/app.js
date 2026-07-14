const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET / with _delay delays response', (t) => {
  const start = Date.now()
  request(app)
    .get('/?_delay=200')
    .expect(200, (err) => {
      t.error(err)
      t.ok(Date.now() - start >= 200, 'response was delayed by at least 200ms')
      t.end()
    })
})

test('GET /posts with _delay strips param and does not affect resource lookup', (t) => {
  request(app)
    .get('/posts?_delay=100')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.length, 100, 'returns all 100 posts without _delay filtering')
      t.end()
    })
})

test('GET / with invalid _delay (non-numeric) proceeds without delay', (t) => {
  const start = Date.now()
  request(app)
    .get('/?_delay=abc')
    .expect(200, (err) => {
      t.error(err)
      t.ok(Date.now() - start < 1000, 'response was not significantly delayed')
      t.end()
    })
})

test('GET / with negative _delay proceeds without delay', (t) => {
  const start = Date.now()
  request(app)
    .get('/?_delay=-1')
    .expect(200, (err) => {
      t.error(err)
      t.ok(Date.now() - start < 1000, 'response was not significantly delayed')
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
