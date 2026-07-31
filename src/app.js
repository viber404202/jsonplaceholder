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

// Error simulation: append ?_status=<code> to any request (e.g. /posts/1?_status=500)
// to force that response status instead of the normal json-server response.
app.use((req, res, next) => {
  const status = parseInt(req.query._status, 10)
  if (!status || status < 400 || status > 599) return next()

  res.status(status).jsonp({
    error: true,
    status,
    message: `Simulated ${status} error`
  })
})

// Error simulation: dedicated route for any HTTP status, e.g. GET /error/500
app.get('/error/:code', (req, res) => {
  const status = parseInt(req.params.code, 10)
  if (!status || status < 400 || status > 599) {
    return res.status(400).jsonp({
      error: true,
      message: 'Invalid status code, expected 400-599'
    })
  }

  res.status(status).jsonp({
    error: true,
    status,
    message: `Simulated ${status} error`
  })
})

app.use(router)

module.exports = app
