# astrid-client, your new alternative
A REAL Platform Agnostic GraphQL Client, made with javascript and ❤️️.

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
