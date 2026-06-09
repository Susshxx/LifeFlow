// const express = require('express');
// const router = express.Router();

// // ── Fetch polyfill: Node 18+ has native fetch; older versions need node-fetch ─
// let fetchFn;
// (async () => {
//   if (typeof fetch !== 'undefined') {
//     fetchFn = fetch;
//   } else {
//     try {
//       const mod = await import('node-fetch');
//       fetchFn = mod.default;
//     } catch {
//       console.error('[geocode] Neither native fetch nor node-fetch is available. Run: npm install node-fetch');
//     }
//   }
// })();

// // ── In-memory cache — coordinates rarely change ───────────────────────────────
// const geocodeCache = new Map();
// // In-flight dedup — reuse same promise for concurrent identical requests
// const inFlight = new Map();

// // Nominatim: 1 req/sec from a single IP. From a server all users share one IP,
// // so we queue calls with a small inter-request gap.
// let lastNominatimCall = 0;
// const MIN_INTERVAL_MS = 150; // ~6 req/s — well within Nominatim's 1 req/s per IP

// async function nominatimFetch(lat, lon) {
//   const key = `${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;

//   if (geocodeCache.has(key)) return geocodeCache.get(key);
//   if (inFlight.has(key)) return inFlight.get(key);

//   const promise = (async () => {
//     // Throttle
//     const wait = lastNominatimCall + MIN_INTERVAL_MS - Date.now();
//     if (wait > 0) await new Promise(r => setTimeout(r, wait));
//     lastNominatimCall = Date.now();

//     const url =
//       `https://nominatim.openstreetmap.org/reverse` +
//       `?format=json&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;

//     const res = await fetchFn(url, {
//       headers: {
//         'User-Agent': 'LifeFlow-BloodDonation/1.0 (contact@lifeflow.app)',
//         Accept: 'application/json',
//         'Accept-Language': 'en',
//       },
//       // 8-second hard timeout so one slow Nominatim response doesn't stall a slot
//       signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined,
//     });

//     if (!res.ok) {
//       throw new Error(`Nominatim HTTP ${res.status}`);
//     }

//     const data = await res.json();

//     // Nominatim returns { error: 'Unable to geocode' } for ocean/void coords
//     const result = (!data || data.error) ? { address: {}, display_name: '' } : data;

//     geocodeCache.set(key, result);
//     // Prune cache if it grows very large
//     if (geocodeCache.size > 5000) {
//       Array.from(geocodeCache.keys()).slice(0, 500).forEach(k => geocodeCache.delete(k));
//     }

//     return result;
//   })().finally(() => inFlight.delete(key));

//   inFlight.set(key, promise);
//   return promise;
// }

// // ── Build a short human-readable label from a Nominatim address object ────────
// function shortLabel(data) {
//   if (!data) return '';
//   const a = data.address || {};
//   const parts = [
//     a.neighbourhood || a.suburb || a.quarter ||
//     a.village || a.hamlet || a.road || a.pedestrian,
//     a.city || a.town || a.municipality || a.county,
//   ].filter(Boolean);
//   if (parts.length) return parts.join(', ');
//   // Fallback: first two comma-parts of the full display_name
//   return (data.display_name || '').split(',').slice(0, 2).join(',').trim();
// }

// // ── GET /api/geocode/reverse?lat=…&lon=… ─────────────────────────────────────
// router.get('/reverse', async (req, res) => {
//   const { lat, lon } = req.query;

//   if (!lat || !lon) {
//     return res.status(400).json({ error: 'lat and lon are required' });
//   }

//   const parsedLat = parseFloat(lat);
//   const parsedLon = parseFloat(lon);
//   if (isNaN(parsedLat) || isNaN(parsedLon)) {
//     return res.status(400).json({ error: 'lat and lon must be numbers' });
//   }
//   if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180) {
//     return res.status(400).json({ error: 'Coordinates out of range' });
//   }

//   if (!fetchFn) {
//     return res.status(503).json({ error: 'Geocoding service not available (fetch not configured)' });
//   }

//   try {
//     const data = await nominatimFetch(parsedLat, parsedLon);
//     res.json(data);
//   } catch (err) {
//     console.error('[geocode] /reverse error:', err.message);
//     // Return a 200 with an empty address instead of 502 so the frontend
//     // can fall back gracefully rather than logging a red error.
//     res.status(200).json({ address: {}, display_name: '', _geocodeError: true });
//   }
// });

// // ── POST /api/geocode/batch  body: [{id, lat, lon}, …] (max 20) ───────────────
// router.post('/batch', async (req, res) => {
//   if (!fetchFn) {
//     return res.status(503).json({ error: 'Geocoding service not available' });
//   }

//   const items = Array.isArray(req.body) ? req.body.slice(0, 20) : [];
//   if (!items.length) {
//     return res.status(400).json({ error: 'Send an array of {id, lat, lon}' });
//   }

//   const results = await Promise.allSettled(
//     items.map(({ lat, lon, id }) =>
//       nominatimFetch(lat, lon).then(data => ({ id, label: shortLabel(data) }))
//     )
//   );

//   const out = {};
//   results.forEach(r => {
//     if (r.status === 'fulfilled') {
//       out[r.value.id] = r.value.label;
//     }
//   });

//   res.json(out);
// });

// module.exports = router;


const express = require('express');
const router = express.Router();

// ── Fetch polyfill ────────────────────────────────────────────────────────────
let fetchFn;
(async () => {
  if (typeof fetch !== 'undefined') {
    fetchFn = fetch;
  } else {
    try {
      const mod = await import('node-fetch');
      fetchFn = mod.default;
    } catch {
      console.error('[geocode] Run: npm install node-fetch');
    }
  }
})();

const geocodeCache = new Map();
const inFlight = new Map();
let lastNominatimCall = 0;
const MIN_INTERVAL_MS = 200;

// ── Single Nominatim fetch with accept-language as QUERY PARAM ────────────────
// The query param is what actually controls display_name language in Nominatim.
// The map tiles show Nepali because they read name:ne tags from OSM.
// Nominatim reads the same tags — we just need to tell it to prefer 'ne'.
async function nominatimFetch(lat, lon, lang) {
  const key = `${lang}:${parseFloat(lat).toFixed(4)},${parseFloat(lon).toFixed(4)}`;

  if (geocodeCache.has(key)) return geocodeCache.get(key);
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const wait = lastNominatimCall + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastNominatimCall = Date.now();

    // IMPORTANT: accept-language must be a QUERY PARAM for Nominatim to
    // localise the display_name. The HTTP header alone is ignored by some
    // Nominatim versions.
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'jsonv2');       // jsonv2 includes place_name
    url.searchParams.set('lat', lat);
    url.searchParams.set('lon', lon);
    url.searchParams.set('zoom', '16');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('namedetails', '1');       // includes name:ne, name:en etc.
    url.searchParams.set('extratags', '1');         // includes extra OSM tags
    url.searchParams.set('accept-language', lang);  // THIS is what controls language

    const res = await fetchFn(url.toString(), {
      headers: {
        'User-Agent': 'LifeFlow-BloodDonation/1.0 (contact@lifeflow.app)',
        Accept: 'application/json',
        'Accept-Language': lang,
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined,
    });

    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    const result = (!data || data.error)
      ? { address: {}, display_name: '', namedetails: {}, place_name: '' }
      : data;

    geocodeCache.set(key, result);
    if (geocodeCache.size > 5000) {
      Array.from(geocodeCache.keys()).slice(0, 500).forEach(k => geocodeCache.delete(k));
    }
    return result;
  })().finally(() => inFlight.delete(key));

  inFlight.set(key, promise);
  return promise;
}

// ── Extract Nepali label ──────────────────────────────────────────────────────
// The OSM map tiles you see already show Nepali text like काठमाडौं, चाँगुनारायण.
// Nominatim stores the SAME data — namedetails contains name:ne for every
// feature that has a Nepali name tagged in OSM.
//
// Best strategy:
//   1. namedetails['name:ne'] = Nepali name of the exact feature (most precise)
//   2. display_name from ne request = full address string already in Nepali
//      e.g. "कसुला टोल, चाँगुनारायण नगरपालिका, भक्तपुर, बागमती प्रदेश, नेपाल"
//      → take first 2 parts → "कसुला टोल, चाँगुनारायण नगरपालिका"
//   3. address fields (neighbourhood, city etc.) when already in Nepali
//   4. English fallback
function extractLabel(neResult, enResult) {
  const nd = neResult.namedetails || {};
  const na = neResult.address || {};
  const ea = (enResult || {}).address || {};

  // ── Step 1: Parse display_name from the Nepali request ───────────────────
  // This is the same data the map tiles use — already fully localised.
  // "कसुला टोल, चाँगुनारायण नगरपालिका, भक्तपुर जिल्ला, बागमती प्रदेश, नेपाल"
  const SKIP = new Set(['नेपाल', 'Nepal', '']);
  const displayParts = (neResult.display_name || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 1 && !SKIP.has(s) && !/^\d+$/.test(s));

  // ── Step 2: address fields from Nepali request ────────────────────────────
  const neNeighbourhood =
    na.neighbourhood || na.suburb || na.quarter ||
    na.village || na.hamlet || na.road || na.pedestrian;
  const neCity =
    na.city || na.town || na.municipality || na.city_district;

  // ── Step 3: explicit name:ne tag ─────────────────────────────────────────
  const nepaliNameTag = nd['name:ne'];

  // ── Build label (priority order) ─────────────────────────────────────────

  // Best: neighbourhood + city from localised address fields
  if (neNeighbourhood && neCity) {
    return `${neNeighbourhood}, ${neCity}`;
  }

  // Good: first 2 parts of Nepali display_name
  // This is identical to what the map tile labels show
  if (displayParts.length >= 2) {
    return `${displayParts[0]}, ${displayParts[1]}`;
  }

  // OK: single address field
  if (neNeighbourhood || neCity || nepaliNameTag) {
    return neNeighbourhood || neCity || nepaliNameTag;
  }

  // OK: single display_name part
  if (displayParts.length === 1) return displayParts[0];

  // Fallback: English
  const enNeighbourhood = ea.neighbourhood || ea.suburb || ea.village || ea.road;
  const enCity = ea.city || ea.town || ea.municipality;
  if (enNeighbourhood && enCity) return `${enNeighbourhood}, ${enCity}`;
  if (enNeighbourhood || enCity) return enNeighbourhood || enCity;

  return '';
}

// ── Fetch Nepali + English in parallel, build label ──────────────────────────
async function geocode(lat, lon) {
  const [neResult, enResult] = await Promise.allSettled([
    nominatimFetch(lat, lon, 'ne'),
    nominatimFetch(lat, lon, 'en'),
  ]);

  const ne = neResult.status === 'fulfilled' ? neResult.value : { address: {}, display_name: '', namedetails: {} };
  const en = enResult.status === 'fulfilled' ? enResult.value : { address: {}, display_name: '', namedetails: {} };

  return {
    neData: ne,
    enData: en,
    label: extractLabel(ne, en),
  };
}

// ── GET /api/geocode/reverse?lat=…&lon=… ─────────────────────────────────────
router.get('/reverse', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required' });

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  if (isNaN(parsedLat) || isNaN(parsedLon))
    return res.status(400).json({ error: 'lat and lon must be numbers' });
  if (parsedLat < -90 || parsedLat > 90 || parsedLon < -180 || parsedLon > 180)
    return res.status(400).json({ error: 'Coordinates out of range' });
  if (!fetchFn)
    return res.status(503).json({ error: 'Geocoding service not available' });

  try {
    const { neData, label } = await geocode(parsedLat, parsedLon);
    res.json({ ...neData, _label: label });
  } catch (err) {
    console.error('[geocode] /reverse error:', err.message);
    res.status(200).json({
      address: {}, display_name: '', namedetails: {},
      _label: '', _geocodeError: true,
    });
  }
});

// ── POST /api/geocode/batch  body: [{id, lat, lon}, …] (max 20) ───────────────
router.post('/batch', async (req, res) => {
  if (!fetchFn)
    return res.status(503).json({ error: 'Geocoding service not available' });

  const items = Array.isArray(req.body) ? req.body.slice(0, 20) : [];
  if (!items.length)
    return res.status(400).json({ error: 'Send an array of {id, lat, lon}' });

  const results = await Promise.allSettled(
    items.map(({ lat, lon, id }) =>
      geocode(lat, lon).then(({ label }) => ({ id, label }))
    )
  );

  const out = {};
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.label) {
      out[r.value.id] = r.value.label;
    }
  });

  res.json(out);
});

module.exports = router;