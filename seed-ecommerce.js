// Run this to (re)generate the e-commerce resources in data.json:
//
//   node seed-ecommerce.js
//
// Unlike seed.js — which builds a whole fresh db.json out of random Faker
// output — this script is deterministic and rewrites only the categories,
// products, carts and orders keys of data.json in place. Running it twice
// leaves the file byte-for-byte identical, so it never churns the diff.

var fs = require('fs')
var path = require('path')

var DATA = path.join(__dirname, 'data.json')

// Anchor for the generated timestamps. A literal (rather than Date.now) keeps
// the output reproducible.
var EPOCH = Date.parse('2026-07-31T00:00:00.000Z')
var DAY = 24 * 60 * 60 * 1000

// Credit https://github.com/bryc/code/blob/master/jshash/PRNGs.md
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    var t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

var rnd = mulberry32(20260731)

function int(min, max) {
  return min + Math.floor(rnd() * (max - min + 1))
}

function pick(list) {
  return list[int(0, list.length - 1)]
}

// Money is computed in integer cents throughout and only divided on the way
// out, so no total ever lands on 0.30000000000000004.
function cents(value) {
  return Math.round(value) / 100
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Tables
var db = {}
db.categories = []
db.products = []
db.carts = []
db.orders = []

// Ten products per category, in category order, as [title, typical price in
// cents]. Prices are per-product rather than per-category on purpose: a single
// category-wide range prices a keyboard like a laptop.
var CATALOG = [
  {
    name: 'Electronics',
    products: [
      ['Wireless Noise-Cancelling Headphones', 24999],
      ['4K Streaming Media Player', 4999],
      ['Bluetooth Portable Speaker', 7999],
      ['Smart Video Doorbell', 17999],
      ['Digital Photo Frame', 12999],
      ['Noise-Isolating Earbuds', 8999],
      ['Universal Remote Control', 2499],
      ['Portable Power Bank 20000mAh', 3999],
      ['Smart Thermostat', 21999],
      ['HD Webcam with Ring Light', 6999]
    ]
  },
  {
    name: 'Computers',
    products: [
      ['14-inch Ultrabook Laptop', 119999],
      ['Mechanical Gaming Keyboard', 12999],
      ['Ergonomic Wireless Mouse', 4999],
      ['27-inch QHD Monitor', 32999],
      ['1TB NVMe Solid State Drive', 9999],
      ['USB-C Docking Station', 18999],
      ['Laptop Cooling Stand', 3499],
      ['32GB DDR5 Memory Kit', 13999],
      ['Wi-Fi 6 Mesh Router', 24999],
      ['External Blu-ray Drive', 8999]
    ]
  },
  {
    name: 'Home & Kitchen',
    products: [
      ['Stainless Steel Air Fryer', 12999],
      ['12-Cup Drip Coffee Maker', 7999],
      ['Cast Iron Skillet', 3499],
      ['Cordless Stick Vacuum', 27999],
      ['Non-Stick Cookware Set', 16999],
      ['Electric Kettle with Temperature Control', 6999],
      ['Bamboo Cutting Board Set', 2999],
      ['Robot Vacuum with Room Mapping', 44999],
      ['Memory Foam Mattress Topper', 15999],
      ['Ceramic Dinnerware Set', 11999]
    ]
  },
  {
    name: 'Sports & Outdoors',
    products: [
      ['Adjustable Dumbbell Set', 34999],
      ['2-Person Backpacking Tent', 21999],
      ['Insulated Water Bottle 32oz', 3499],
      ['Yoga Mat with Alignment Lines', 4999],
      ['Carbon Fiber Trekking Poles', 8999],
      ['Indoor Cycling Bike', 59999],
      ['Waterproof Hiking Backpack', 13999],
      ['Resistance Band Set', 2499],
      ['Inflatable Paddle Board', 39999],
      ['Three-Season Sleeping Bag', 9999]
    ]
  },
  {
    name: 'Clothing',
    products: [
      ['Merino Wool Crew Socks', 1899],
      ['Lightweight Rain Jacket', 8999],
      ['Slim Fit Chino Trousers', 5999],
      ['Organic Cotton T-Shirt', 2499],
      ['Fleece-Lined Hoodie', 5499],
      ['Leather Chelsea Boots', 14999],
      ['Packable Down Vest', 9999],
      ['Stretch Denim Jeans', 6999],
      ['Linen Button-Down Shirt', 6499],
      ['Ribbed Knit Beanie', 1999]
    ]
  },
  {
    name: 'Books',
    products: [
      ['Illustrated Atlas of the World', 4499],
      ["Beginner's Guide to Woodworking", 2299],
      ['Modern Bread Baking', 2999],
      ['Field Guide to Garden Birds', 1799],
      ['One-Pot Weeknight Cooking', 2499],
      ['Watercolor for Absolute Beginners', 1999],
      ['A Pocket History of Astronomy', 1499],
      ['The Complete Home Repair Manual', 3999],
      ['Mindful Mornings Journal', 1299],
      ['Big Book of Logic Puzzles', 999]
    ]
  },
  {
    name: 'Beauty',
    products: [
      ['Vitamin C Facial Serum', 2999],
      ['Hydrating Sheet Mask Set', 1999],
      ['Bamboo Charcoal Cleanser', 1499],
      ['Argan Oil Hair Treatment', 2199],
      ['SPF 50 Mineral Sunscreen', 1899],
      ['Matte Liquid Lipstick', 1299],
      ['Detangling Hair Brush', 1599],
      ['Eucalyptus Bath Salts', 1199],
      ['Retinol Night Cream', 3499],
      ['Nail Care Kit', 2499]
    ]
  },
  {
    name: 'Toys & Games',
    products: [
      ['Wooden Building Blocks', 3499],
      ['1000-Piece Jigsaw Puzzle', 1999],
      ['Remote Control Off-Road Truck', 6999],
      ['Family Strategy Board Game', 4499],
      ['Magnetic Tile Construction Set', 5999],
      ['Plush Teddy Bear', 2499],
      ['Kids Art Supply Case', 3299],
      ['Marble Run Starter Kit', 4999],
      ['Travel Card Game Collection', 1499],
      ['Dinosaur Figurine Playset', 2799]
    ]
  },
  {
    name: 'Automotive',
    products: [
      ['All-Weather Floor Mats', 8999],
      ['Portable Jump Starter', 9999],
      ['Microfiber Wash Mitt Set', 1799],
      ['Dash Camera with Night Vision', 14999],
      ['Tire Pressure Gauge', 1499],
      ['Magnetic Car Phone Mount', 2299],
      ['Ceramic Coating Spray', 3499],
      ['Roof Cargo Carrier', 27999],
      ['Folding Windshield Sun Shade', 2499],
      ['OBD2 Diagnostic Scanner', 5999]
    ]
  },
  {
    name: 'Garden',
    products: [
      ['Stainless Steel Hand Trowel', 1699],
      ['Expandable Garden Hose 50ft', 3999],
      ['Raised Cedar Planter Box', 12999],
      ['Solar Pathway Lights', 4599],
      ['Cordless Hedge Trimmer', 15999],
      ['Compost Tumbler Bin', 10999],
      ['Heavy-Duty Garden Kneeler', 4999],
      ['Bird Feeder with Squirrel Guard', 3799],
      ['Drip Irrigation Starter Kit', 5499],
      ['Terracotta Plant Pot Set', 3299]
    ]
  }
]

var OPENERS = [
  'An everyday essential built to last.',
  'A customer favorite, restocked weekly.',
  'Designed for daily use and easy to store.',
  'Compact, lightweight and built for travel.',
  'Thoughtfully made from premium materials.',
  'A dependable pick for first-time buyers.'
]

var CLOSERS = [
  'Ships in fully recyclable packaging.',
  'Backed by a two-year limited warranty.',
  'Includes a one-year replacement guarantee.',
  'Free returns within thirty days.',
  'Independently tested to meet safety standards.',
  'Available while stocks last.'
]

// Order statuses, weighted so that the common ones dominate.
var STATUSES = [
  'pending',
  'paid',
  'paid',
  'shipped',
  'shipped',
  'delivered',
  'delivered',
  'delivered',
  'cancelled',
  'refunded'
]

// Categories and products
var productId = 0

CATALOG.forEach(function (entry, index) {
  var categoryId = index + 1

  db.categories.push({
    id: categoryId,
    name: entry.name,
    slug: slugify(entry.name)
  })

  entry.products.forEach(function (product) {
    var title = product[0]
    productId += 1

    // Jitter the typical price by up to 12% either way, then snap to a .95 or
    // .99 ending the way real listings do.
    var jittered = product[1] * (0.88 + rnd() * 0.24)
    var dollars = Math.max(1, Math.round(jittered / 100))
    var price = (dollars - 1) * 100 + pick([95, 99])

    db.products.push({
      categoryId: categoryId,
      id: productId,
      title: title,
      description: pick(OPENERS) + ' ' + pick(CLOSERS),
      price: cents(price),
      // Every nineteenth product is out of stock, so that filtering on
      // ?stock=0 returns something worth looking at.
      stock: productId % 19 === 0 ? 0 : int(3, 250),
      rating: Math.round((3 + rnd() * 2) * 10) / 10,
      imageUrl: 'https://picsum.photos/seed/product-' + productId + '/600/600',
      thumbnailUrl: 'https://picsum.photos/seed/product-' + productId + '/200/200'
    })
  })
})

// Line items, drawn from the catalog without repeating a product
function buildItems(count) {
  var chosen = {}
  var items = []

  while (items.length < count) {
    var product = db.products[int(0, db.products.length - 1)]
    if (chosen[product.id]) continue
    chosen[product.id] = true

    var quantity = int(1, 4)
    var price = Math.round(product.price * 100)

    items.push({
      productId: product.id,
      quantity: quantity,
      price: product.price,
      total: cents(price * quantity)
    })
  }

  return items.sort(function (a, b) {
    return a.productId - b.productId
  })
}

function totalItems(items) {
  return items.reduce(function (sum, item) {
    return sum + item.quantity
  }, 0)
}

function totalPrice(items) {
  return cents(
    items.reduce(function (sum, item) {
      return sum + Math.round(item.total * 100)
    }, 0)
  )
}

// One open cart per user, five past orders per user
var USERS = 10
var cartId = 0
var orderId = 0

for (var userId = 1; userId <= USERS; userId++) {
  cartId += 1
  var cartItems = buildItems(int(1, 5))

  db.carts.push({
    userId: userId,
    id: cartId,
    items: cartItems,
    totalItems: totalItems(cartItems),
    total: totalPrice(cartItems),
    updatedAt: new Date(EPOCH - int(0, 20) * DAY - int(0, 86399) * 1000).toISOString()
  })

  for (var n = 0; n < 5; n++) {
    orderId += 1
    var orderItems = buildItems(int(1, 6))

    db.orders.push({
      userId: userId,
      id: orderId,
      items: orderItems,
      totalItems: totalItems(orderItems),
      total: totalPrice(orderItems),
      status: pick(STATUSES),
      createdAt: new Date(EPOCH - int(1, 540) * DAY - int(0, 86399) * 1000).toISOString()
    })
  }
}

// Sanity checks — a broken foreign key in a fake API is worse than no API
function check(condition, message) {
  if (!condition) {
    console.error('seed-ecommerce: ' + message)
    process.exit(1)
  }
}

var existing = JSON.parse(fs.readFileSync(DATA, 'utf-8'))
var categoryIds = {}
var productIds = {}
var userIds = {}

db.categories.forEach(function (category) {
  categoryIds[category.id] = true
})
db.products.forEach(function (product) {
  productIds[product.id] = true
})
existing.users.forEach(function (user) {
  userIds[user.id] = true
})

db.products.forEach(function (product) {
  check(categoryIds[product.categoryId], 'product ' + product.id + ' has a dangling categoryId')
})

db.carts.concat(db.orders).forEach(function (record) {
  check(userIds[record.userId], 'record ' + record.id + ' has a dangling userId')
  check(record.items.length > 0, 'record ' + record.id + ' has no items')
  check(record.totalItems === totalItems(record.items), 'record ' + record.id + ' has a bad totalItems')
  check(record.total === totalPrice(record.items), 'record ' + record.id + ' has a bad total')
  record.items.forEach(function (item) {
    check(productIds[item.productId], 'record ' + record.id + ' has a dangling productId')
  })
})

// Replace only our four keys, leaving the original six in their original order
existing.categories = db.categories
existing.products = db.products
existing.carts = db.carts
existing.orders = db.orders

// data.json is checked in with CRLF line endings, so match it rather than
// rewriting every line of the file.
var json = JSON.stringify(existing, null, 2).replace(/\n/g, '\r\n') + '\r\n'
fs.writeFileSync(DATA, json)

console.log(
  'data.json updated: %d categories, %d products, %d carts, %d orders',
  db.categories.length,
  db.products.length,
  db.carts.length,
  db.orders.length
)
