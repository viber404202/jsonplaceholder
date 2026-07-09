const jsonServer = require('json-server')
const clone = require('clone')
const data = require('../data.json')

const app = jsonServer.create()
const router = jsonServer.router(clone(data), { _isFake: true })

// Always expose the total record count on list responses so clients can build
// pagination UIs without having to opt into `_page`/`_limit` first.
// json-server already sets X-Total-Count (and Link) for paginated requests;
// this fills the gap for plain and filtered list requests.
const defaultRender = router.render
router.render = (req, res) => {
  const body = res.locals.data
  if (Array.isArray(body) && !res.getHeader('X-Total-Count')) {
    res.setHeader('X-Total-Count', body.length)
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count')
  }
  defaultRender(req, res)
}

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
