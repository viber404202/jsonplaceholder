const test = require('tape')
const request = require('supertest')
const app = require('../src/app')

test('GET /', (t) => {
  request(app)
    .get('/')
    .expect(200, (err) => t.end(err))
})

test('GET /events streams SSE', (t) => {
  const http = require('http')
  const server = app.listen(0, () => {
    const { port } = server.address()
    const req = http.get(
      `http://localhost:${port}/events?interval=250`,
      (res) => {
        t.equal(res.statusCode, 200, 'responds 200')
        t.equal(
          res.headers['content-type'],
          'text/event-stream',
          'sends event-stream content type'
        )

        let buffer = ''
        res.on('data', (chunk) => {
          buffer += chunk.toString()
          const line = buffer.split('\n').find((l) => l.startsWith('data: '))
          if (line) {
            const payload = JSON.parse(line.slice('data: '.length))
            t.ok(payload.type, 'event has a type')
            t.ok(payload.resource, 'event references a resource')
            req.destroy()
            server.close(() => t.end())
          }
        })
      }
    )
    // Ignore the abort triggered by req.destroy() above.
    req.on('error', (err) => {
      if (err.code !== 'ECONNRESET') t.end(err)
    })
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
