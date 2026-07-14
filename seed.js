// Run this to (re)generate the fake dataset the API serves.
//
//   node seed.js                       # regenerate data.json with defaults
//   node seed.js --users=20 --products=200
//   node seed.js --out=db.json         # write somewhere else
//   node seed.js --help                # list every tunable count
//
// The app (src/app.js) serves ./data.json, so that is the default output.
var fs      = require('fs')
var path    = require('path')
var _       = require('underscore')
var Factory = require('rosie').Factory
var Faker   = require('Faker')
var db      = {}

// ── Configurable dataset size ────────────────────────────────────────────
// Every count can be overridden from the command line, e.g. --photosPerAlbum=10
var defaults = {
  out:             'data.json',
  users:           10,
  postsPerUser:    10,
  commentsPerPost: 5,
  albumsPerUser:   10,
  photosPerAlbum:  50,
  todosPerUser:    20,
  // New resource types
  products:        50,
  cartsPerUser:    2,
  maxItemsPerCart: 5,
  ordersPerUser:   3,
  maxItemsPerOrder: 5,
}

function parseArgs(argv, defs) {
  var cfg = _.clone(defs)
  argv.forEach(function (arg) {
    if (arg === '--help' || arg === '-h') {
      console.log('Usage: node seed.js [--key=value ...]\n\nTunable keys (default):')
      _.each(defs, function (v, k) { console.log('  --' + k + '=' + v) })
      process.exit(0)
    }
    var m = /^--([^=]+)=(.+)$/.exec(arg)
    if (!m) return
    var key = m[1], val = m[2]
    if (!(key in defs)) {
      console.warn('Ignoring unknown option --' + key)
      return
    }
    cfg[key] = (typeof defs[key] === 'number') ? parseInt(val, 10) : val
  })
  return cfg
}

var cfg = parseArgs(process.argv.slice(2), defaults)

// Credit http://www.paulirish.com/2009/random-hex-color-code-snippets/
function hex() {
  return Math.floor(Math.random() * 16777215).toString(16)
}

// A small, stable set of product categories to reference.
var CATEGORIES = [
  'electronics', 'books', 'clothing', 'home', 'toys',
  'sports', 'beauty', 'grocery', 'automotive', 'garden'
]
var ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled']

// Tables
db.posts    = []
db.comments = []
db.albums   = []
db.photos   = []
db.users    = []
db.todos    = []
db.products = []
db.carts    = []
db.orders   = []

// ── Factories ──────────────────────────────────────────────────────────────
Factory.define('post')
  .sequence('id')
  .attr('title', function() {return Faker.Lorem.sentence()})
  .attr('body', function() {return Faker.Lorem.sentences(4)})

Factory.define('comment')
  .sequence('id')
  .attr('name', function() {return Faker.Lorem.sentence()})
  .attr('email', function() {return Faker.Internet.email()})
  .attr('body', function() {return Faker.Lorem.sentences(4)})

Factory.define('album')
  .sequence('id')
  .attr('title', function() {return Faker.Lorem.sentence()})

Factory.define('photo')
  .sequence('id')
  .attr('title', function() {return Faker.Lorem.sentence()})
  .option('color', hex())
  .attr('url', [ 'color' ], function(color) {
    return 'http://placehold.it/600/' + color
  })
  .attr('thumbnailUrl', [ 'color' ], function(color) {
    return 'http://placehold.it/150/' + color
  })

Factory.define('todo')
  .sequence('id')
  .attr('title', function() {return Faker.Lorem.sentence()})
  .attr('completed', function() { return _.random(1) ? true : false})

Factory.define('user')
  .sequence('id')
  .after(function(user) {
    var card = Faker.Helpers.userCard()
    _.each(card, function(value, key) {
      user[key] = value
    })
  })

// New: catalog products (independent resource)
Factory.define('product')
  .sequence('id')
  .attr('name', function() { return _.map(Faker.Lorem.words(2), capitalize).join(' ') })
  .attr('description', function() { return Faker.Company.catchPhrase() })
  .attr('category', function() { return Faker.random.array_element(CATEGORIES) })
  .attr('price', function() { return Math.round((5 + Math.random() * 495) * 100) / 100 })
  .attr('stock', function() { return Faker.random.number(500) })
  .attr('rating', function() { return Math.round((1 + Math.random() * 4) * 10) / 10 })
  .attr('image', [ 'id' ], function() { return 'http://placehold.it/300/' + hex() })

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

// Build one { productId, quantity, price } line item picking from real products.
function lineItem() {
  var product = Faker.random.array_element(db.products)
  var quantity = 1 + Faker.random.number(4)
  return { productId: product.id, quantity: quantity, price: product.price }
}

function totalOf(items) {
  return Math.round(_.reduce(items, function(sum, i) {
    return sum + i.price * i.quantity
  }, 0) * 100) / 100
}

// ── Generation ───────────────────────────────────────────────────────────────
// Products first so carts/orders can reference real product ids.
_(cfg.products).times(function() {
  db.products.push(Factory.build('product'))
})

// Has many relationships
// Users
_(cfg.users).times(function () {
  var user = Factory.build('user')
  db.users.push(user)

  // Posts
  _(cfg.postsPerUser).times(function() {
    // userId not set in create so that it appears as the last attribute
    var post = Factory.build('post', {userId: user.id})
    db.posts.push(post)

    // Comments
    _(cfg.commentsPerPost).times(function () {
      var comment = Factory.build('comment', {postId: post.id})
      db.comments.push(comment)
    })
  })

  // Albums
  _(cfg.albumsPerUser).times(function() {
    var album = Factory.build('album', {userId: user.id})
    db.albums.push(album)

    // Photos
    _(cfg.photosPerAlbum).times(function() {
      var photo = Factory.build('photo', {albumId: album.id})
      db.photos.push(photo)
    })
  })

  // Todos
  _(cfg.todosPerUser).times(function() {
    var todo = Factory.build('todo', {userId: user.id})
    db.todos.push(todo)
  })

  // Carts (one open cart snapshot per iteration)
  if (db.products.length) {
    _(cfg.cartsPerUser).times(function() {
      var items = _(1 + Faker.random.number(cfg.maxItemsPerCart - 1)).times(lineItem)
      db.carts.push({
        id: db.carts.length + 1,
        userId: user.id,
        items: items,
        total: totalOf(items)
      })
    })

    // Orders
    _(cfg.ordersPerUser).times(function() {
      var items = _(1 + Faker.random.number(cfg.maxItemsPerOrder - 1)).times(lineItem)
      db.orders.push({
        id: db.orders.length + 1,
        userId: user.id,
        status: Faker.random.array_element(ORDER_STATUSES),
        items: items,
        total: totalOf(items)
      })
    })
  }
})

var outPath = path.resolve(__dirname, cfg.out)
fs.writeFileSync(outPath, JSON.stringify(db, null, 2))

console.log('Wrote ' + cfg.out + ' with:')
_.each(db, function(rows, name) {
  console.log('  ' + name + ': ' + rows.length)
})
