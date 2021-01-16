
export async function createClient({ base_url={}, options={} }){
    //console.log(base_url)
    process.env.ASTRID_BASE_URL = base_url
    
}


export async function astridQuery({ query={}, variables={}}) {
  const data = JSON.stringify({
    query: query,
    variables: variables
  });
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
  return json
}


export async function astridWatchQuery({ query={}, variables={}, interval={}}, callback) {
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
    body: JSON.stringify({query, variables})
    })
    const json = await response.json();
    
    return json
}

// TODO IMPROVE ERROR HANDLINGg
// Simplify GraphQL Client-Side requests.
//Copyright (C) 2021 Leonardo Kwieczinski Sampaio