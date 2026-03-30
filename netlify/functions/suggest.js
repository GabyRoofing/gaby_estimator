const https = require('https');

exports.handler = async function(event) {
  const query = event.queryStringParameters && event.queryStringParameters.q;
  
  if (!query || query.length < 3) {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify([])
    };
  }

  const apiKey = '374d07ce2e47e2e558c940a7b6dd09fa';
  
  // Use address endpoint with just the street portion
  const path = '/propertyapi/v1.0.0/property/basicprofile?address1=' + 
    encodeURIComponent(query) + '&address2=NJ&pagesize=6';

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.gateway.attomdata.com',
      path: path,
      method: 'GET',
      headers: { 'apikey': apiKey, 'Accept': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const properties = parsed.property || [];
          const suggestions = properties.slice(0,6).map(p => {
            const addr = p.address;
            const city = addr.locality || addr.line2.split(',')[0].trim();
            return {
              display: addr.line1 + ', ' + addr.line2,
              address1: addr.line1,
              address2: city
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

    req.on('error', () => {
      resolve({
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }, body: JSON.stringify([]) });
    });

    req.end();
  });
};
