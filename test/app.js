const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /search?q=', (t) => {
  request(app)
    .get('/search?q=qui')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.total > 0, 'finds matches across resources')
      t.equal(res.body.query, 'qui', 'echoes the normalized query')
      t.ok(res.body.results.posts, 'includes posts collection')
      t.end()
    })
})

test('GET /search (missing q)', (t) => {
  request(app)
    .get('/search')
    .expect(400, (err) => t.end(err))
})

test('GET /search?resource=&limit=', (t) => {
  request(app)
    .get('/search?q=qui&resource=posts&limit=3')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.results.posts.length <= 3, 'respects limit')
      t.equal(
        Object.keys(res.body.results).length,
        1,
        'restricts to requested resource'
      )
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
