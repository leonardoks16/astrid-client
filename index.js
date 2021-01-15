//import fetch from 'node-fetch';

export async function createClient({ base_url={}, options={} }){
    //console.log(base_url)
    process.env.ASTRID_BASE_URL = base_url
    
}


export async function astridQuery({query={}, variables={}}) {
  const data = JSON.stringify({
    query: query,
    variables: variables
  });
  //console.log(variables)
  //console.log(process.env.ASTRID_BASE_URL)
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
  //console.log('eu',json)
  return json.data
  console.log(json.data);
}
 

/*
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
    setInterval(async function () {
      const response = await fetch(process.env.ASTRID_BASE_URL, options);
      const json = await response.json();
      //console.log(json.data)
      return json,m
    }, interval)
  //TODO RETURN
    
    
}

*/
export async function astridWatchQuery({query={}, variables={}, interval={}}, callback) {
  var i = 0;
  const data = JSON.stringify({
    query: query,
    variables: variables
  });
  
  
  return new Promise(function (resolve) {
    var git = setInterval(async function () {
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
      resolve(json)
      callback(json);
      i++
    }, interval)
  })
}


export async function astridMutation({ mutation={}, variables={} }) {
    var query = mutation;
    const response = await fetch(process.env.ASTRID_BASE_URL, {
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
    const json = await response.json();
    return json.data
}

//TODO configurar para retornar os valores ao invés de console.log(), also handle errors