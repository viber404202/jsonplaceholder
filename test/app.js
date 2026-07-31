const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /posts/1?_status=500 simulates an error status on a real route', (t) => {
  request(app)
    .get('/posts/1?_status=500')
    .expect(500, (err, res) => {
      t.error(err)
      t.equal(res.body.status, 500)
      t.end()
    })
})

test('GET /posts/1?_status=200 is ignored (not an error status)', (t) => {
  request(app)
    .get('/posts/1?_status=200')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.id, 1)
      t.end()
    })
})

test('GET /error/500 simulates a dedicated error route', (t) => {
  request(app)
    .get('/error/500')
    .expect(500, (err, res) => {
      t.error(err)
      t.equal(res.body.status, 500)
      t.end()
    })
})

test('GET /error/999 rejects an out-of-range status code', (t) => {
  request(app)
    .get('/error/999')
    .expect(400, (err) => t.end(err))
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
