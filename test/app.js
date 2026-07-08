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

test('e-commerce resources', (t) => {
  const resources = {
    products: 20,
    carts: 10,
    orders: 20,
    tags: 12
  }

  const names = Object.keys(resources)
  t.plan(names.length * 2)

  names.forEach((name) => {
    request(app)
      .get('/' + name)
      .expect(200, (err, res) => {
        t.error(err, `GET /${name}`)
        t.equal(
          res.body.length,
          resources[name],
          `/${name} returns ${resources[name]} items`
        )
      })
  })
})

test('GET /products?category=electronics', (t) => {
  request(app)
    .get('/products?category=electronics')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.length > 0, 'returns matching products')
      t.ok(
        res.body.every((p) => p.category === 'electronics'),
        'every product is in the electronics category'
      )
      t.end()
    })
})

test('GET /users/1/orders', (t) => {
  request(app)
    .get('/users/1/orders')
    .expect(200, (err, res) => {
      t.error(err)
      t.ok(res.body.length > 0, 'returns orders for the user')
      t.ok(
        res.body.every((o) => o.userId === 1),
        'every order belongs to user 1'
      )
      t.end()
    })
})
