const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /posts sets X-Total-Count on plain list', (t) => {
  request(app)
    .get('/posts')
    .expect('X-Total-Count', '100')
    .expect('Access-Control-Expose-Headers', /X-Total-Count/)
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.length, 100, 'returns all 100 posts')
      t.end()
    })
})

test('GET /posts?userId=1 sets X-Total-Count on filtered list', (t) => {
  request(app)
    .get('/posts?userId=1')
    .expect('X-Total-Count', '10')
    .expect('Access-Control-Expose-Headers', /X-Total-Count/)
    .expect(200, (err) => t.end(err))
})

test('GET /posts paginates with _page/_limit and sets Link', (t) => {
  request(app)
    .get('/posts?_page=2&_limit=10')
    .expect('X-Total-Count', '100')
    .expect('Link', /rel="next"/)
    .expect('Access-Control-Expose-Headers', /Link/)
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.length, 10, 'returns 10 posts per page')
      t.equal(res.body[0].id, 11, 'second page starts at id 11')
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
