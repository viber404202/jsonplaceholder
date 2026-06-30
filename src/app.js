const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

app.get('/health', (req, res) => res.json({ status: 'ok' }))

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
