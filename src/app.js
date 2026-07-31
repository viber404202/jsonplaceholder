const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')
const auth = require('./auth')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

// Rate limiting — once a client passes RATE_LIMIT_MAX requests inside a
// RATE_LIMIT_WINDOW_MS window, every further request gets 429 + Retry-After
// until the window rolls over, so backoff code has something to hit.
// Clients are keyed by X-Forwarded-For (falling back to the socket IP) so
// requests behind a proxy/load balancer are attributed to the real caller.
const rateLimitClients = new Map()

app.use((req, res, next) => {
  const max = parseInt(process.env.RATE_LIMIT_MAX, 10) || 100
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000
  const key = (req.get('X-Forwarded-For') || req.ip || '').split(',')[0].trim()
  const now = Date.now()
  const client = rateLimitClients.get(key)

  if (!client || now > client.resetAt) {
    rateLimitClients.set(key, { count: 1, resetAt: now + windowMs })
    return next()
  }

  client.count += 1

  if (client.count > max) {
    const retryAfter = Math.ceil((client.resetAt - now) / 1000)
    res.set('Retry-After', String(retryAfter))
    return res.status(429).jsonp({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`
    })
  }

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

// Fake auth flow — stub JWTs for demoing protected routes (see src/auth.js)
app.use(jsonServer.bodyParser)
app.post('/login', auth.login)
app.post('/register', auth.register)
app.get('/profile', auth.profile)

app.use(router)

module.exports = app
