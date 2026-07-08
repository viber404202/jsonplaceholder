const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /posts/1?_status=500 simulates an error', (t) => {
  request(app)
    .get('/posts/1?_status=500')
    .expect(500, (err, res) => {
      t.error(err)
      t.equal(res.body.status, 500, 'echoes the status code')
      t.equal(res.body.message, 'Internal Server Error', 'includes reason phrase')
      t.end()
    })
})

test('GET /posts?_status=404 simulates a not-found', (t) => {
  request(app)
    .get('/posts?_status=404')
    .expect(404, (err) => t.end(err))
})

test('an invalid _status is rejected', (t) => {
  request(app)
    .get('/posts?_status=999')
    .expect(400, (err) => t.end(err))
})

test('requests without _status are unaffected', (t) => {
  request(app)
    .get('/posts/1')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.id, 1, 'returns the real resource')
      t.end()
    })
})

test('POST /uploads', (t) => {
  request(app)
    .post('/uploads')
    .send({ name: 'photo.png' })
    .expect(201, (err, res) => {
      t.error(err)
      t.equal(res.body.name, 'photo.png', 'echoes the file name')
      t.ok(res.body.url, 'returns a url')
      t.ok(res.body.url.endsWith('/photo.png'), 'url includes the file name')
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
