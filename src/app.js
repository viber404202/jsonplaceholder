const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

const isValidStatus = (status) => Number.isInteger(status) && status >= 100 && status <= 599

const sendSimulatedError = (res, status) => {
  res.status(status).jsonp({
    error: true,
    status,
    message: `Simulated ${status} response`
  })
}

app.use((req, res, next) => {
  if (req.path === '/') return next()
  router.db.setState(clone(data))
  next()
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

// Error simulation: append `?_status=500` to any route to force that
// response status, e.g. GET /posts/1?_status=500
app.use((req, res, next) => {
  const status = parseInt(req.query._status, 10)
  if (isValidStatus(status)) return sendSimulatedError(res, status)
  next()
})

// Error simulation: GET /error/:code returns that status directly,
// e.g. GET /error/500
app.get('/error/:code', (req, res) => {
  const status = parseInt(req.params.code, 10)
  if (!isValidStatus(status)) {
    return res.status(400).jsonp({
      error: true,
      status: 400,
      message: `Invalid status code: ${req.params.code}`
    })
  }
  sendSimulatedError(res, status)
})

app.use(router)

module.exports = app
