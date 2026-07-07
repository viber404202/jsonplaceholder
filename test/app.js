const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /posts includes X-Total-Count header', (t) => {
  request(app)
    .get('/posts')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.headers['x-total-count'], '100', 'X-Total-Count should be 100')
      t.end()
    })
})

test('GET /posts?_page=1&_limit=10 includes pagination headers', (t) => {
  request(app)
    .get('/posts?_page=1&_limit=10')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.headers['x-total-count'], '100', 'X-Total-Count should be 100')
      t.equal(res.headers['x-page'], '1', 'X-Page should be 1')
      t.equal(res.headers['x-per-page'], '10', 'X-Per-Page should be 10')
      t.equal(res.headers['x-total-pages'], '10', 'X-Total-Pages should be 10')
      t.end()
    })
})

test('GET /posts/1 does not include pagination headers', (t) => {
  request(app)
    .get('/posts/1')
    .expect(200, (err, res) => {
      t.error(err)
      t.notOk(res.headers['x-total-count'], 'X-Total-Count should not be set for single resource')
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
