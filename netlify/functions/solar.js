const https = require('https');

exports.handler = async function(event) {
  const lat = event.queryStringParameters && event.queryStringParameters.lat;
  const lng = event.queryStringParameters && event.queryStringParameters.lng;
  const apiKey = 'AIzaSyDkBtCAt2LP808QV_MvUApT9XOAR_HFf70';

  if (!lat || !lng) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing lat/lng' })
    };
  }

  const path = '/v1/buildingInsights:findClosest?location.latitude=' + lat + '&location.longitude=' + lng + '&requiredQuality=LOW&key=' + apiKey;

  return new Promise((resolve) => {
    const options = {
      hostname: 'solar.googleapis.com',
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: data
        });
      });
    });

    req.on('error', error => {
      resolve({
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: error.message })
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ statusCode: 504, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Timeout' }) });
    });

    req.end();
  });
};
