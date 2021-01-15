const fetch = require('node-fetch');
require('dotenv').config();

async function createClient({base_url={},options={}}){
    //console.log(base_url)
    process.env.BASE_URL = base_url
    
}

export default createClient

async function astridQuery(query) {
  const data = JSON.stringify({
    query: query,
  });
  console.log(process.env.BASE_URL)
  const response = await fetch(
    process.env.BASE_URL,
    {
      method: 'post',
      body: data,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Node',
      },
    }
  );

  const json = await response.json();
  console.log(json.data);
}

export default astridQuery

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
async function astridWatchQuery(query, interval) {
    const data = JSON.stringify({
        query: query,
    });
    const options = {
        method: 'POST',
        body: data,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            'User-Agent': 'Node',
          },
    };
    
    setInterval(function(){
        fetch(process.env.BASE_URL, options)
        .then(r=>r.text())
        .then(d=>{
            console.log(d)
        });
        }, interval);
    
    
}

async function astridMutation({ mutation={}, variables={} }) {
    var query = mutation;

    fetch(process.env.BASE_URL, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({
        query,
        variables: variables
    })
    })
    .then(r => r.json())
    .then(data => console.log(data));
    }
//astridQuery(query);

//astridWatchQuery(query, 1000)

createClient({
        base_url: 'http://localhost:4000/'
    })

//astridQuery(query);

//astridMutation({
//    mutation: mutation,
//    variables:  {
//        login,
//        password,
//      }
//})
