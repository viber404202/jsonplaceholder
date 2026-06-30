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

// Pagination metadata headers
app.use((req, res, next) => {
  if (req.method !== 'GET') return next()

  const match = req.path.match(/^\/([a-z]+)$/)
  if (!match) return next()

  const collection = router.db.get(match[1]).value()
  if (!Array.isArray(collection)) return next()

  const total = collection.length
  const page = parseInt(req.query._page, 10)
  const perPage = parseInt(req.query._limit, 10) || 10

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    res.set('X-Total-Count', total)
    if (!isNaN(page)) {
      res.set('X-Page', page)
      res.set('X-Per-Page', perPage)
      res.set('X-Total-Pages', Math.ceil(total / perPage))
    }
    return originalJson(body)
  }

  next()
})

app.use(router)

module.exports = app
