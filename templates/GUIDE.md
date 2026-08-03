<main>

## Guide

You can use JSONPlaceholder with any type of project that needs to get JSON data (React, Vue, Node, Rails, Swift, Android, ...).

Below you'll find examples using [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API). You can copy paste them in your browser Console to quickly test JSONPlaceholder.

### Get a resource

```js
fetch('https://jsonplaceholder.typicode.com/posts/1')
  .then(response => response.json())
  .then(json => console.log(json))

// Output
{
  id: 1,
  title: '[...]',
  body: '[...]',
  userId: 1
}
```

<div id="codefund"><!-- fallback content --></div>
<script src="https://app.codefund.io/properties/338/funder.js" async="async"></script>

### List all resources

```js
fetch('https://jsonplaceholder.typicode.com/posts')
  .then(response => response.json())
  .then(json => console.log(json))

// Output
[
  { id: 1, title: '[...]' /* ... */ },
  /* ... */
  { id: 100, title: '[...]' /* ... */ }
]
```

### Create a resource

```js
fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify({
      title: 'foo',
      body: 'bar',
      userId: 1
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
  .then(response => response.json())
  .then(json => console.log(json))

// Output
{
  id: 101,
  title: 'foo',
  body: 'bar',
  userId: 1
}
```

Important: the resource will not be really created on the server but it will be faked as if. In other words, if you try to access a post using 101 as an id, you'll get a 404 error.

### Update a resource

#### With PUT

```js
fetch('https://jsonplaceholder.typicode.com/posts/1', {
    method: 'PUT',
    body: JSON.stringify({
      id: 1,
      title: 'foo',
      body: 'bar',
      userId: 1
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
  .then(response => response.json())
  .then(json => console.log(json))

// Output
{
  id: 1,
  title: 'foo',
  body: 'bar',
  userId: 1
}
```

#### With PATCH

```js
fetch('https://jsonplaceholder.typicode.com/posts/1', {
    method: 'PATCH',
    body: JSON.stringify({
      title: 'foo'
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  })
  .then(response => response.json())
  .then(json => console.log(json))

// Output
{
  id: 1,
  title: 'foo',
  body: '[...]',
  userId: 1
}
```

Important: the resource will not be really updated on the server but it will be faked as if. 

### Delete a resource

```js
fetch('https://jsonplaceholder.typicode.com/posts/1', {
  method: 'DELETE'
})
```

Important: the resource will not be really deleted on the server but it will be faked as if. 

### Filter resources

Basic filtering is supported through query parameters.

```js
// Will return all the posts that belong to the first user
fetch('https://jsonplaceholder.typicode.com/posts?userId=1')
  .then(response => response.json())
  .then(json => console.log(json))
```

### Nested resources

One level of nested route is available.

```js
// Equivalent to /comments?postId=1
fetch('https://jsonplaceholder.typicode.com/posts/1/comments')
  .then(response => response.json())
  .then(json => console.log(json))
```

Available nested routes:

* https://jsonplaceholder.typicode.com/posts/1/comments
* https://jsonplaceholder.typicode.com/albums/1/photos
* https://jsonplaceholder.typicode.com/users/1/albums
* https://jsonplaceholder.typicode.com/users/1/todos
* https://jsonplaceholder.typicode.com/users/1/posts
* https://jsonplaceholder.typicode.com/categories/1/products
* https://jsonplaceholder.typicode.com/users/1/carts
* https://jsonplaceholder.typicode.com/users/1/orders

### E-commerce resources

Alongside the blog-style resources, JSONPlaceholder serves a small shop: 10 `categories`, 100 `products`, 10 `carts` (one open cart per user) and 50 `orders` (five per user). They're handy for prototyping storefronts, baskets and checkout flows.

```js
fetch('https://jsonplaceholder.typicode.com/products/1')
  .then(response => response.json())
  .then(json => console.log(json))

// Output
{
  categoryId: 1,
  id: 1,
  title: 'Wireless Noise-Cancelling Headphones',
  description: '[...]',
  price: 220.95,
  stock: 46,
  rating: 3.1,
  imageUrl: '[...]',
  thumbnailUrl: '[...]'
}
```

Carts and orders embed their line items, so a basket needs a single request:

```js
fetch('https://jsonplaceholder.typicode.com/carts/1')
  .then(response => response.json())
  .then(json => console.log(json))

// Output
{
  userId: 1,
  id: 1,
  items: [
    { productId: 41, quantity: 1, price: 19.99, total: 19.99 },
    /* ... */
  ],
  totalItems: 8,
  total: 501.92,
  updatedAt: '[...]'
}
```

Orders additionally carry a `status` of `pending`, `paid`, `shipped`, `delivered`, `cancelled` or `refunded`, and a `createdAt` timestamp:

```js
// Every order for the first user that has shipped
fetch('https://jsonplaceholder.typicode.com/users/1/orders?status=shipped')
  .then(response => response.json())
  .then(json => console.log(json))
```

</main>
