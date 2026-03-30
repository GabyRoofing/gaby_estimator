const https = require('https');

exports.handler = async function(event, context) {
  const address1 = event.queryStringParameters && event.queryStringParameters.address1;
  const address2 = event.queryStringParameters && event.queryStringParameters.address2;
  
  if (!address1 || !address2) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing address parameters' })
    };
  }

  const apiKey = '374d07ce2e47e2e558c940a7b6dd09fa';
  
  // Try both address formats
  const path = '/propertyapi/v1.0.0/property/basicprofile?address1=' + 
    encodeURIComponent(address1) + '&address2=' + encodeURIComponent(address2);

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.gateway.attomdata.com',
      path: path,
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    console.log('Calling ATTOM:', options.hostname + options.path);

    const req = https.request(options, (res) => {
      let data = '';
      console.log('ATTOM status:', res.statusCode);
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('ATTOM response:', data.substring(0, 200));
        resolve({
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: data
        });
      });
    });

    req.on('error', (error) => {
      console.log('ATTOM error:', error.message);
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ 
          error: error.message,
          hostname: options.hostname,
          path: options.path
        })
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        statusCode: 504,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Request timed out' })
      });
    });

    req.end();
  });
};
