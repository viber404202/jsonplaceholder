const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('POST /login returns a token', (t) => {
  request(app)
    .post('/login')
    .send({ email: 'Sincere@april.biz', password: 'secret' })
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.token, 'returns a token')
      t.equal(res.body.token.split('.').length, 3, 'token looks like a JWT')
      t.equal(res.body.user.id, 1, 'matches the seeded user')
      t.end()
    })
})

test('POST /login requires credentials', (t) => {
  request(app)
    .post('/login')
    .send({ email: 'someone@example.com' })
    .expect(400, (err) => t.end(err))
})

test('POST /register returns a token and new user', (t) => {
  request(app)
    .post('/register')
    .send({ name: 'Ada', email: 'ada@example.com', password: 'secret' })
    .expect(201, (err, res) => {
      t.error(err)
      t.ok(res.body.token, 'returns a token')
      t.equal(res.body.user.name, 'Ada', 'echoes the new user name')
      t.end()
    })
})

test('GET /profile with a valid token', (t) => {
  request(app)
    .post('/login')
    .send({ email: 'Sincere@april.biz', password: 'secret' })
    .expect(200, (err, res) => {
      t.error(err)
      request(app)
        .get('/profile')
        .set('Authorization', 'Bearer ' + res.body.token)
        .expect(200, (err2, profileRes) => {
          t.error(err2)
          t.equal(profileRes.body.email, 'Sincere@april.biz', 'returns the user')
          t.end()
        })
    })
})

test('GET /profile without a token is rejected', (t) => {
  request(app)
    .get('/profile')
    .expect(401, (err) => t.end(err))
})

test('GET /profile with a bad token is rejected', (t) => {
  request(app)
    .get('/profile')
    .set('Authorization', 'Bearer not.a.token')
    .expect(401, (err) => t.end(err))
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
