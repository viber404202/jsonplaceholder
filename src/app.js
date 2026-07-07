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

// Cross-resource full-text search.
// GET /search?q=term[&resource=posts][&limit=20]
// Case-insensitive substring match over every string field of every record.
app.get('/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase()

  if (!q) {
    return res.status(400).jsonp({ error: 'Missing required query parameter: q' })
  }

  const limit = Math.max(0, parseInt(req.query.limit, 10) || 0)
  const state = router.db.getState()

  const wanted = req.query.resource
  const resources = wanted
    ? String(wanted).split(',').map((r) => r.trim()).filter(Boolean)
    : Object.keys(state)

  const matches = (record) =>
    Object.values(record).some(
      (value) =>
        (typeof value === 'string' || typeof value === 'number') &&
        String(value).toLowerCase().includes(q)
    )

  const results = {}
  let total = 0

  resources.forEach((name) => {
    const collection = state[name]
    if (!Array.isArray(collection)) return

    const matched = collection.filter(matches)
    total += matched.length
    results[name] = limit ? matched.slice(0, limit) : matched
  })

  res.jsonp({ query: q, total, results })
})

app.use(router)

module.exports = app
