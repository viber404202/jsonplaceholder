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

// Simulate slow networks: `?_delay=2000` delays the response by 2000ms.
// Useful for testing loading states. Capped to avoid holding connections open.
const MAX_DELAY = 5000

app.use((req, res, next) => {
  const delay = Number.parseInt(req.query._delay, 10)

  // Remove so json-server doesn't treat it as a filter on the resource.
  delete req.query._delay

  if (Number.isNaN(delay) || delay <= 0) return next()

  setTimeout(next, Math.min(delay, MAX_DELAY))
})

app.use(router)

module.exports = app
