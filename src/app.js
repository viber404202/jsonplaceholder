const http = require('http')
const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

app.use((req, res, next) => {
  if (req.path === '/') return next()
  router.db.setState(clone(data))
  next()
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

// Status simulation. Any request with a `?_status=<code>` query param returns
// that HTTP status immediately, so clients can test error handling.
// e.g. GET /posts/1?_status=500
app.use((req, res, next) => {
  if (!('_status' in req.query)) return next()
  const code = Number(req.query._status)
  if (!Number.isInteger(code) || code < 100 || code > 599) {
    return res
      .status(400)
      .jsonp({ error: '_status must be an integer between 100 and 599' })
  }
  res.status(code).jsonp({
    status: code,
    message: http.STATUS_CODES[code] || 'Unknown Status'
  })
})

// Fake file upload endpoint. Doesn't store anything, just echoes back a
// plausible URL so clients can prototype upload flows.
app.use(jsonServer.bodyParser)
app.post('/uploads', (req, res) => {
  const id = Math.random().toString(36).slice(2, 10)
  const name = (req.body && req.body.name) || 'file'
  res.status(201).jsonp({
    id,
    name,
    url: 'https://jsonplaceholder.typicode.com/uploads/' + id + '/' + name,
    createdAt: new Date().toISOString()
  })
})

app.use(router)

module.exports = app
