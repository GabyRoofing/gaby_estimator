const https = require('https');

exports.handler = async function(event) {
  const query = event.queryStringParameters && event.queryStringParameters.q;
  
  if (!query || query.length < 3) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Query too short' })
    };
  }

  const apiKey = '374d07ce2e47e2e558c940a7b6dd09fa';
  const path = '/propertyapi/v1.0.0/property/address?address=' + 
    encodeURIComponent(query) + '&pagesize=6&orderby=address';

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.gateway.attomdata.com',
      path: path,
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const properties = parsed.property || [];
          const suggestions = properties.map(p => {
            const addr = p.address;
            return {
              display: addr.line1 + ', ' + addr.line2,
              address1: addr.line1,
              address2: addr.locality || addr.line2.split(',')[0].trim()
            };
          });
          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify(suggestions)
          });
        } catch(e) {
          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify([])
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.message })
      });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ statusCode: 504, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify([]) });
    });

    req.end();
  });
};
