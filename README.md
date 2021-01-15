# astrid-client
GraphQL Client made 100% In javascript

# Usage:
// Import package
import { createClient, astridQuery, astridWatchQuery, astridMutation } from '../astrid-client';

createClient({
    base_url: 'http://localhost:4000'
})

const query = `{
    userList { _id }
  }`

const mutation = `
mutation login($login: String! $password: String! ){
  login(login: $login, password: $password ){
    token, id
  }
}
`

const login = 'nexxus@gmail.com'
const password = '14213712'


astridMutation({
  mutation: mutation,
    variables:  {
      login,
      password,
    }
  }).then(data => {
    //console.log(data)
});

astridQuery(query).then(data => {
  //console.log(data)
});


astridWatchQuery(query, 100, function(x) {
  //console.log(x)
}).catch(error => console.error(error))
