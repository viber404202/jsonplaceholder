const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

const DEFAULT_FLAKY_TIMEOUT_MS = 30000

// Rolls the flaky outcome: half the time responds 500 immediately, the
// other half hangs for `_flakyTimeout` ms (default 30s) before responding
// 504, so a client with a shorter timeout sees a real timeout.
const triggerFlaky = (req, res) => {
  if (Math.random() < 0.5) {
    return res.status(500).jsonp({
      error: true,
      status: 500,
      message: 'Simulated flaky failure'
    })
  }
  const timeout = parseInt(req.query._flakyTimeout, 10) || DEFAULT_FLAKY_TIMEOUT_MS
  setTimeout(() => {
    res.status(504).jsonp({
      error: true,
      status: 504,
      message: 'Simulated flaky timeout'
    })
  }, timeout)
}

app.use((req, res, next) => {
  if (req.path === '/') return next()
  router.db.setState(clone(data))
  next()
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

// Flaky mode: append `?_flaky=<0-100>` to any route to randomly 500 or
// time out that percentage of requests, e.g. GET /posts?_flaky=30
app.use((req, res, next) => {
  const rate = parseFloat(req.query._flaky)
  if (!Number.isNaN(rate) && rate > 0 && Math.random() * 100 < rate) {
    return triggerFlaky(req, res)
  }
  next()
})

// Dedicated flaky endpoint: GET /flaky/:rate rolls against the given
// percentage without needing a real resource, e.g. GET /flaky/30
app.get('/flaky/:rate', (req, res) => {
  const rate = parseFloat(req.params.rate)
  if (Number.isNaN(rate) || rate < 0 || rate > 100) {
    return res.status(400).jsonp({
      error: true,
      status: 400,
      message: `Invalid flaky rate: ${req.params.rate}`
    })
  }
  if (Math.random() * 100 < rate) return triggerFlaky(req, res)
  res.jsonp({ ok: true, rate })
})

app.use(router)

module.exports = app
