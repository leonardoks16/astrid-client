# astrid-client
GraphQL Client made 100% In javascript

## Usage:
# header H1
## header H2
### header H3
#### header H4
##### header H5
###### header H6
```
// Import package
import { createClient, astridQuery, astridWatchQuery, astridMutation } from '../astrid-client';

// Create connection to graphql endpoint
createClient({
    base_url: 'http://localhost:4000'
})

// Define your query
const query = `{
    userList { _id }
  }`

// Define your mutation
const mutation = `
mutation login($login: String! $password: String! ){
  login(login: $login, password: $password ){
    token, id
  }
}
`

// Define variables if will be needed
const login = 'nexxus@gmail.com'
const password = '14213712'


// Make a mutation
astridMutation({
  mutation: mutation,
    variables:  {
      login,
      password,
    }
  }).then(data => {
    //console.log(data)
});

// Make a simple query
astridQuery(query).then(data => {
  //console.log(data)
});


// Make a persisted query, with a interval in ms

astridWatchQuery(query, 100, function(x) {
  //console.log(x)
}).catch(error => console.error(error))
```
