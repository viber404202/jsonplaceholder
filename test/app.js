const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET e-commerce collections', (t) => {
  const expected = {
    categories: 10,
    products: 100,
    carts: 10,
    orders: 50
  }

  t.plan(Object.keys(expected).length * 2)

  Object.keys(expected).forEach((resource) => {
    request(app)
      .get(`/${resource}`)
      .expect(200, (err, res) => {
        t.error(err)
        t.equal(
          res.body.length,
          expected[resource],
          `/${resource} returns ${expected[resource]} items (got ${res.body.length})`
        )
      })
  })
})

test('GET e-commerce relationships', (t) => {
  t.plan(6)

  // categories -> products, via the nested route
  request(app)
    .get('/categories/2/products')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.length, 10, 'category 2 has 10 products')
      t.ok(
        res.body.every((product) => product.categoryId === 2),
        'every nested product belongs to category 2'
      )
    })

  // users -> carts and orders, via the nested routes
  request(app)
    .get('/users/1/carts')
    .expect(200, (err, res) => {
      t.error(err)
      t.equal(res.body.length, 1, 'user 1 has one open cart')
    })

  request(app)
    .get('/users/1/orders')
    .expect(200, (err, res) => {
      t.equal(res.body.length, 5, 'user 1 has five orders')
    })
})

test('e-commerce line item totals add up', (t) => {
  t.plan(3)

  request(app)
    .get('/orders/1')
    .expect(200, (err, res) => {
      t.error(err)

      const order = res.body
      const items = order.totalItems
      const total = order.total

      const countedItems = order.items.reduce((sum, i) => sum + i.quantity, 0)
      // Compare in cents so floating point can't produce a false failure
      const countedTotal =
        order.items.reduce((sum, i) => sum + Math.round(i.total * 100), 0) / 100

      t.equal(countedItems, items, `totalItems matches the line items (${items})`)
      t.equal(countedTotal, total, `total matches the line items (${total})`)
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
