const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')
const events = require('./events')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/events') return next()
  router.db.setState(clone(data))
  next()
})

app.use(jsonServer.defaults({
  logger: process.env.NODE_ENV !== 'production'
}))

// Simulated real-time feed (Server-Sent Events) for testing live-updating UIs.
// Registered before the json-server router so it isn't treated as a resource.
app.get('/events', events.handler)

app.use(router)

module.exports = app
