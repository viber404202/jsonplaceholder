const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

app.get('/health', (req, res) => res.json({ status: 'ok' }))

// Rate limiting
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000
const clients = new Map()

app.use((req, res, next) => {
  if (req.path === '/health') return next()

  const ip = req.ip || req.connection.remoteAddress
  const now = Date.now()
  const client = clients.get(ip)

  if (!client || now > client.resetAt) {
    clients.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return next()
  }

  client.count += 1

  if (client.count > RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil((client.resetAt - now) / 1000)
    res.set('Retry-After', retryAfter)
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`
    })
  }

  next()
})

// Request delay simulation
app.use((req, res, next) => {
  const delay = parseInt(req.query._delay, 10)
  if (delay > 0) return setTimeout(next, delay)
  next()
})

app.use((req, res, next) => {
  if (req.path === '/') return next()
  router.db.setState(clone(data))
  next()
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

app.use(router)

module.exports = app
