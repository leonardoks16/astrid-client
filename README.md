# astrid-client, a new alternative
A REAL Platform Agnostic GraphQL Client, made with javascript and love.
Deal with GraphQL in a blazing fast way


<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#built-with">Simple Query</a></li>
          <li><a href="#built-with">Simple Query</a></li>
          <li><a href="#built-with">Simple Query</a></li>
          <li><a href="#built-with">Simple Query</a></li>
          <li><a href="#built-with">Simple Query</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

<!-- usage -->
## Usage:
### Create connection to GraphQL endpoint

```
// Import package
import { createClient, astridQuery, astridWatchQuery, astridMutation } from '../astrid-client';


// Create connection to graphql endpoint
createClient({
    base_url: 'http://localhost:4000'
})
```

### Make simple Query
```
// Define your query
const query = `{
    userList { _id }
  }`
  
// Make a simple query
astridQuery(query).then(data => {
  //console.log(data)
});
```

### Make simple Mutation
```
// Define your mutation
const mutation = `
mutation login($login: String! $password: String! ){
  login(login: $login, password: $password ){
    token, id
  }
}
`

// Define your mutation variables if will be needed
const login = 'nexxus@gmail.com'
const password = '14213712'

// Make mutation
astridMutation({
  mutation: mutation,
    variables:  {
      login,
      password,
    }
  }).then(data => {
    //console.log(data)
});

```

### Persisted query
```
// Make a persisted query, with a interval in ms

astridWatchQuery(query, 100, function(x) {
  //console.log(x)
}).catch(error => console.error(error))
```
