const fetch = require('node-fetch');

export async function createClient({ base_url={}, options={} }){
    //console.log(base_url)
    process.env.ASTRID_BASE_URL = base_url
    
}

export async function astridQuery(query) {
  const data = JSON.stringify({
    query: query,
  });
  console.log(process.env.ASTRID_BASE_URL)
  const response = await fetch(
    process.env.ASTRID_BASE_URL,
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
  return json.data
}

export async function astridWatchQuery(query, interval) {
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
        fetch(process.env.ASTRID_BASE_URL, options)
        .then(r=>r.text())
        .then(d=>{
            console.log(d)
        });
        }, interval);
    
    
}

export async function astridMutation({ mutation={}, variables={} }) {
    var query = mutation;

    fetch(process.env.ASTRID_BASE_URL, {
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

//TODO configurar para retornar os valores ao invés de console.log(), also handle errors