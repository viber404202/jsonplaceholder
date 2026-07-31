const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const MAX_DELAY_MS = parseInt(process.env.MAX_DELAY_MS, 10) || 10000

// _delay/X-Delay let clients simulate latency. Read before json-server's
// router sees the request, since it otherwise treats unknown query params
// as field filters (?_delay=2000 would look like "field _delay equals 2000"
// and return an empty result set).
function parseDelay(req) {
  const raw = req.query._delay !== undefined ? req.query._delay : req.get('X-Delay')
  const ms = parseInt(raw, 10)
  if (!Number.isFinite(ms) || ms < 0) return 0
  return Math.min(ms, MAX_DELAY_MS)
}

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

app.set('parseDelay', parseDelay)
app.set('maxDelayMs', MAX_DELAY_MS)

app.use((req, res, next) => {
  if (req.path === '/') return next()
  router.db.setState(clone(data))
  next()
})

app.use((req, res, next) => {
  const delay = parseDelay(req)
  delete req.query._delay
  if (delay === 0) return next()
  setTimeout(next, delay)
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

app.use(router)

module.exports = app
