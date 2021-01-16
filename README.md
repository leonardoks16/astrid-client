# astrid-client, a new alternative
A REAL Platform Agnostic GraphQL Client, made with javascript and love.
Deal with GraphQL in a blazing fast way


<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#installation">Installation</a>
    </li>
    <li>
      <a href="#usage">Usage</a>
      <ul>
        <li><a href="#make-simple-query">Simple Query</a></li>
        <li><a href="#query-with-variables">Query with variables</a></li>
        <li><a href="#persisted-queries">Persisted Query</a></li>
        <li><a href="#make-simple-mutation">Make simple Mutation</a></li>
        <li><a href="#built-with">Subscriptions (Coming Soon)</a></li>
      </ul>
    </li>
  </ol>
</details>

## Installation
Install npm package
* npm
  ```sh
  npm install @leonardoks16/astrid-client@latest --save
  ```
<!-- usage -->
## Usage:
### Create connection to GraphQL endpoint

```
// Import package, you can import only what will be used, of course. Only createClient is required
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
}).catch(error => console.error(error));
```
### Query With Variables 
```
astridQuery({
  query: queryWithVar,
  variables: {id, token}
}).then(data => {
  console.log(data)
}).catch(error => console.error(error));
```

### Persisted queries

#### inputs: query, interval, callback function

```
// Make a persisted query, with a interval in ms

astridWatchQuery(query, 100, function(x) {
  //console.log(x)
}).catch(error => console.error(error))
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
const login = 'leonardosyo@gmail.com'
const password = '123456767'

// you can do this if you want too
const {login, password} = payload

// or just pass the variables as json object too

// Make a mutation
astridMutation({
  mutation: mutation,
    variables:  {
      login,
      password,
    }
  }).then(data => {
    //console.log(data)
}).catch(error => console.error(error))
```


