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

### Paginate resources

Use `_page` and (optionally) `_limit` to paginate returned data. `_limit` defaults to 10 items per page.

```js
// Second page, 20 posts per page
fetch('https://jsonplaceholder.typicode.com/posts?_page=2&_limit=20')
  .then(response => response.json())
  .then(json => console.log(json))
```

The total number of items is always returned in the `X-Total-Count` header, so you can build pagination UIs. This header is sent on every list request, even when you don't paginate.

```js
fetch('https://jsonplaceholder.typicode.com/posts?_page=1&_limit=10')
  .then(response => {
    console.log(response.headers.get('X-Total-Count')) // e.g. "100"
    return response.json()
  })
  .then(json => console.log(json))
```

When you use `_page`, a `Link` header is also returned with `first`, `prev`, `next` and `last` URLs to make navigation easy.

```
Link: <.../posts?_page=1&_limit=10>; rel="first",
      <.../posts?_page=3&_limit=10>; rel="next",
      <.../posts?_page=10&_limit=10>; rel="last"
```

Both `X-Total-Count` and `Link` are listed in `Access-Control-Expose-Headers`, so they are readable from cross-origin browser requests.

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

</main>
