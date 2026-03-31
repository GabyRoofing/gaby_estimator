const https = require('https');

exports.handler = async function(event) {
  const lat = event.queryStringParameters && event.queryStringParameters.lat;
  const lng = event.queryStringParameters && event.queryStringParameters.lng;
  
  if (!lat || !lng) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Missing lat/lng' })
    };
  }

  const apiKey = 'AIzaSyDkBtCAt2LP808QV_MvUApT9XOAR_HFf70';
  const path = '/v1/buildingInsights:findClosest?location.latitude=' + lat + 
    '&location.longitude=' + lng + 
    '&requiredQuality=LOW' +
    '&key=' + apiKey;

  return new Promise((resolve) => {
    const options = {
      hostname: 'solar.googleapis.com',
      path: path,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    console.log('Calling Google Solar API for:', lat, lng);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Solar API status:', res.statusCode);
        try {
          const parsed = JSON.parse(data);
          // Build a clean response with everything useful
          const sp = parsed.solarPotential || {};
          const result = {
            imageryDate: parsed.imageryDate,
            imageryQuality: parsed.imageryQuality,
            center: parsed.center,
            // Roof area
            wholeRoofAreaSqft: sp.wholeRoofStats ? Math.round(sp.wholeRoofStats.areaMeters2 * 10.7639) : 0,
            groundAreaSqft: sp.wholeRoofStats ? Math.round(sp.wholeRoofStats.groundAreaMeters2 * 10.7639) : 0,
            maxArrayAreaSqft: sp.maxArrayAreaMeters2 ? Math.round(sp.maxArrayAreaMeters2 * 10.7639) : 0,
            // Sunshine
            maxSunshineHoursPerYear: sp.maxSunshineHoursPerYear ? Math.round(sp.maxSunshineHoursPerYear) : null,
            // Roof segments with pitch info
            roofSegments: (sp.roofSegmentStats || []).map(function(seg) {
              return {
                areaSqft: Math.round((seg.stats && seg.stats.areaMeters2 || 0) * 10.7639),
                pitchDegrees: seg.pitchDegrees ? Math.round(seg.pitchDegrees * 10) / 10 : 0,
                azimuthDegrees: seg.azimuthDegrees ? Math.round(seg.azimuthDegrees) : 0,
                avgSunshineHours: seg.stats && seg.stats.sunshineQuantiles ? 
                  Math.round(seg.stats.sunshineQuantiles[5]) : null
              };
            }),
            // Max panels
            maxPanels: sp.maxArrayPanelsCount || 0,
            // Raw imagery URL - use Google Maps Static API for the photo
            photoUrl: 'https://maps.googleapis.com/maps/api/staticmap?center=' + lat + ',' + lng + 
              '&zoom=19&size=600x300&maptype=satellite&key=' + apiKey
          };
          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          });
        } catch(e) {
          resolve({
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: data
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

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ statusCode: 504, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'timeout' }) });
    });

    req.end();
  });
};
