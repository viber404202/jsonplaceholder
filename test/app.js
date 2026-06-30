const test = require('tape')
const request = require('supertest')

process.env.RATE_LIMIT_MAX = '5'
process.env.RATE_LIMIT_WINDOW_MS = '60000'

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

test('rate limit returns 429 after exceeding limit', (t) => {
  const max = parseInt(process.env.RATE_LIMIT_MAX, 10)
  let completed = 0

  // Exhaust the rate limit
  const next = () => {
    completed += 1
    if (completed < max) {
      request(app).get('/posts').expect(200, next)
    } else {
      // This request should be blocked
      request(app)
        .get('/posts')
        .expect(429, (err, res) => {
          t.error(err)
          t.equal(res.body.error, 'Too Many Requests')
          t.ok(res.headers['retry-after'], 'Retry-After header present')
          t.end()
        })
    }
  }
  next()
})

test('/health is exempt from rate limit', (t) => {
  request(app)
    .get('/health')
    .expect(200, { status: 'ok' }, (err) => t.end(err))
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
