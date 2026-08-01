'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

const CUISINE_OSM = {
  italian:       'italian',
  japanese:      'japanese',
  chinese:       'chinese',
  indian:        'indian',
  mexican:       'mexican',
  thai:          'thai',
  american:      'american',
  french:        'french',
  greek:         'greek',
  spanish:       'spanish',
  turkish:       'turkish',
  lebanese:      'lebanese|middle_eastern',
  bbq:           'bbq|barbecue',
  mediterranean: 'mediterranean|greek|lebanese',
  korean:        'korean',
  vietnamese:    'vietnamese',
  filipino:      'filipino',
  caribbean:     'caribbean',
  ethiopian:     'ethiopian|african',
  peruvian:      'peruvian',
  burger:        'burger',
  pizza:         'pizza',
  sushi:         'sushi',
  ramen:         'ramen',
  dimsum:        'dim_sum|chinese',
  steak:         'steak|steakhouse',
  seafood:       'seafood|fish',
  wings:         'chicken|wings',
  breakfast:     'breakfast|brunch',
  sandwich:      'sandwich|deli',
  dessert:       'dessert|ice_cream|cake|bakery',
  healthy:       'salad|healthy',
  vegetarian:    'vegetarian',
  vegan:         'vegan',
};

// Multi-select groups — these store arrays; all others store a single string
const MULTI_GROUPS = new Set(['cuisines', 'prices', 'dinings', 'groups']);

const SLICE_COLORS = [
  '#FF6B35', '#E63946', '#2A9D8F', '#E76F51',
  '#457B9D', '#C77DFF', '#06D6A0', '#F4A261',
  '#264653', '#118AB2', '#F72585', '#7B2FBE',
  '#06A77D', '#D62246', '#4CC9F0',
];

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  lat: null,
  lon: null,
  locationLabel: '',
  prefs: {
    // single-select
    radius:    '5000',
    minRating: '0',
    wheelSize: '10',
    // boolean toggles
    openNow:     false,
    kidsOnly:    false,
    pubMode:     false,
    breweryMode: false,
    // multi-select (arrays; empty = any)
    cuisines: [],
    prices:   [],
    dinings:  [],
    groups:   [],
  },
  pool:         [],   // broad pre-fetch for facet highlighting
  poolLoading:  false,
  restaurants:  [],
  currentRotation: 0,
  isSpinning:   false,
};

let poolFetchController = null;

// ── DOM Refs ───────────────────────────────────────────────────────────────

let canvas, ctx, wheelWrapper;

// ── Init ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('wheel-canvas');
  ctx    = canvas.getContext('2d');
  wheelWrapper = document.getElementById('wheel-wrapper');

  setupButtons();
  setupEventListeners();
  requestGeolocation();
});

// ── Page Navigation ────────────────────────────────────────────────────────

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo(0, 0);
}

function showLoading(msg) {
  document.getElementById('loading-text').textContent = msg || 'Searching…';
  document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loading-overlay').classList.add('hidden');
}

// ── Button Setup ───────────────────────────────────────────────────────────

function setupButtons() {
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.dataset.group;
      if (MULTI_GROUPS.has(group)) {
        handleMultiClick(btn, group);
      } else {
        handleSingleClick(btn, group);
      }
    });
  });
}

function handleSingleClick(btn, group) {
  document.querySelectorAll(`.option-btn[data-group="${group}"]`)
    .forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  state.prefs[group] = btn.dataset.value;

  // Radius change → refetch pool (pool is radius-dependent)
  if (group === 'radius') { fetchPool(); return; }

  // Any other single-select (minRating, wheelSize) → re-run facets
  // so cuisine options reflect the updated filter context
  updateFacets();
}

function handleMultiClick(btn, group) {
  const value = btn.dataset.value;

  if (value === 'any') {
    // "Any" clears all specific selections
    document.querySelectorAll(`.option-btn[data-group="${group}"]`)
      .forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    state.prefs[group] = [];
    updateFacets();
    return;
  }

  // Deselect "Any" if present
  const anyBtn = document.querySelector(`.option-btn[data-group="${group}"][data-value="any"]`);
  if (anyBtn) anyBtn.classList.remove('selected');

  // Toggle this button
  btn.classList.toggle('selected');

  // Recompute state from DOM
  const selected = [...document.querySelectorAll(`.option-btn[data-group="${group}"].selected`)]
    .map(b => b.dataset.value).filter(v => v !== 'any');
  state.prefs[group] = selected;

  // Re-activate "Any" if nothing is selected
  if (selected.length === 0 && anyBtn) anyBtn.classList.add('selected');

  updateFacets();
}

// ── Toggle Helper ──────────────────────────────────────────────────────────

function setupToggle(id, prefKey, onChange) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.addEventListener('click', () => {
    state.prefs[prefKey] = !state.prefs[prefKey];
    btn.classList.toggle('active', state.prefs[prefKey]);
    btn.setAttribute('aria-pressed', String(state.prefs[prefKey]));
    if (onChange) onChange();
  });
}

// ── Event Listeners ────────────────────────────────────────────────────────

function setupEventListeners() {
  document.getElementById('btn-geocode').addEventListener('click', geocodeManualLocation);
  document.getElementById('manual-location').addEventListener('keydown', e => {
    if (e.key === 'Enter') geocodeManualLocation();
  });
  document.getElementById('btn-change-location').addEventListener('click', resetLocation);

  // GPS button — explicit user-gesture trigger (more reliable on mobile)
  document.getElementById('btn-use-gps').addEventListener('click', () => {
    if (!navigator.geolocation) { showManualLocation(false); return; }
    _clearGeoTimer();
    // Hide the manual form while we wait, show spinner
    document.getElementById('location-manual').classList.add('hidden');
    setGeoDetecting(true);
    _geoSafetyTimer = setTimeout(() => {
      setGeoDetecting(false);
      showManualLocation(true);
    }, 15000);
    navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,  // force fresh reading
    });
  });
  document.getElementById('btn-find').addEventListener('click', onFindMyFood);
  document.getElementById('btn-spin').addEventListener('click', onSpin);
  document.getElementById('btn-spin-again').addEventListener('click', onSpinAgain);
  document.getElementById('btn-back-2').addEventListener('click', () => showPage('page-search'));

  setupToggle('btn-open-now',  'openNow',     updateFacets);
  setupToggle('btn-kids',      'kidsOnly',    updateFacets);
  setupToggle('btn-pub',       'pubMode',     fetchPool);   // changing pub mode changes pool type
  setupToggle('btn-brewery',   'breweryMode', fetchPool);
}

// ── Geolocation ────────────────────────────────────────────────────────────

// Safety net: if the browser's geolocation never calls back (silent hang on
// some mobile browsers / production deployments), fall back to manual input.
let _geoSafetyTimer = null;
let _geoRequested   = false;  // true once getCurrentPosition has been called

function requestGeolocation() {
  if (!navigator.geolocation) { showManualLocation(); return; }

  _geoRequested = true;
  setGeoDetecting(true);

  // Browser-level timeout is 10 s, but some browsers ignore it.
  // Our own timer guarantees we never leave the user staring at the spinner.
  // On the first auto-attempt we give a bit longer (15 s) in case the
  // OS permission prompt takes time to appear on mobile.
  _geoSafetyTimer = setTimeout(() => {
    console.warn('Geolocation timed out — showing GPS button + manual input');
    setGeoDetecting(false);
    showManualLocation(true); // show both GPS button and manual form
  }, 15000);

  navigator.geolocation.getCurrentPosition(onGeoSuccess, onGeoError, {
    enableHighAccuracy: true,   // use GPS chip on phones when available
    timeout: 12000,
    maximumAge: 60000,
  });
}

// Show/hide the spinner and detecting text inside #location-auto
function setGeoDetecting(active) {
  const spinner = document.getElementById('geo-spinner');
  const text    = document.getElementById('geo-detecting-text');
  const gpsbtn  = document.getElementById('btn-use-gps');
  if (!spinner) return;
  if (active) {
    spinner.style.display = '';
    text.style.display    = '';
    gpsbtn.style.display  = 'none';
  } else {
    spinner.style.display = 'none';
    text.style.display    = 'none';
    gpsbtn.style.display  = '';
  }
}

function _clearGeoTimer() {
  if (_geoSafetyTimer) { clearTimeout(_geoSafetyTimer); _geoSafetyTimer = null; }
}

async function onGeoSuccess(pos) {
  _clearGeoTimer();
  state.lat = pos.coords.latitude;
  state.lon = pos.coords.longitude;
  try {
    const label = await reverseGeocode(state.lat, state.lon);
    state.locationLabel = label;
    confirmLocation(label);
  } catch {
    // Reverse geocode failed (network issue) — still confirm with raw coords
    state.locationLabel = `${state.lat.toFixed(4)}, ${state.lon.toFixed(4)}`;
    confirmLocation(state.locationLabel);
  }
}

function onGeoError(err) {
  _clearGeoTimer();
  setGeoDetecting(false);
  const msgs = {
    1: 'Location access was denied. Tap "Use My Location" to try again, or enter your location below.',
    2: 'Your location could not be determined. Enter it manually below.',
    3: 'Location request timed out. Tap "Use My Location" to retry, or enter your location below.',
  };
  const manual = document.getElementById('location-manual');
  const denied = manual?.querySelector('.location-denied-msg');
  if (denied) denied.textContent = msgs[err?.code] || msgs[2];
  // Show GPS button + manual form so user can retry or type
  showManualLocation(true);
}

// showGpsBtn = true  → show both the GPS retry button and the manual form
// showGpsBtn = false → show only the manual form (e.g. GPS not supported)
function showManualLocation(showGpsBtn) {
  const autoEl   = document.getElementById('location-auto');
  const manualEl = document.getElementById('location-manual');
  if (showGpsBtn) {
    // Keep #location-auto visible (it now just shows the GPS button)
    autoEl.classList.remove('hidden');
    setGeoDetecting(false);
  } else {
    autoEl.classList.add('hidden');
  }
  manualEl.classList.remove('hidden');
}

function resetLocation() {
  state.lat = state.lon = null;
  state.locationLabel = '';
  state.pool = [];
  _geoRequested = false;
  document.getElementById('location-confirmed').classList.add('hidden');
  document.getElementById('location-auto').classList.remove('hidden');
  document.getElementById('location-manual').classList.add('hidden');
  setPoolStatus('');
  requestGeolocation();
}

function confirmLocation(label) {
  document.getElementById('location-auto').classList.add('hidden');
  document.getElementById('location-manual').classList.add('hidden');
  document.getElementById('location-display').textContent = label;
  document.getElementById('location-confirmed').classList.remove('hidden');
  fetchPool(); // kick off background pool fetch
}

async function reverseGeocode(lat, lon) {
  const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error(`Reverse geocode ${res.status}`);
  const data = await res.json();
  const a = data.address || {};
  return [a.city || a.town || a.village || a.county || '', a.country || '']
    .filter(Boolean).join(', ');
}

async function geocodeManualLocation() {
  const query = document.getElementById('manual-location').value.trim();
  if (!query) return;
  const errEl = document.getElementById('geocode-error');
  errEl.classList.add('hidden');
  const btn = document.getElementById('btn-geocode');
  btn.textContent = '…';
  btn.disabled = true;
  try {
    const res  = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) throw new Error('Not found');
    state.lat = parseFloat(data[0].lat);
    state.lon = parseFloat(data[0].lon);
    state.locationLabel = data[0].display_name.split(',').slice(0, 3).join(', ');
    confirmLocation(state.locationLabel);
  } catch {
    errEl.classList.remove('hidden');
  } finally {
    btn.textContent = 'Search';
    btn.disabled = false;
  }
}

// ── Pool — Background Pre-fetch for Faceted Filtering ─────────────────────
//
// We fetch a broad set of nearby places (no cuisine filter) so we can:
//   • Dim cuisine chips that have no matching places in the area
//   • Dim dining-style chips that have no matching amenity types nearby
//
// Triggered whenever location or radius changes, or pub/brewery mode toggles.

async function fetchPool() {
  if (!state.lat || !state.lon) return;

  // Cancel any in-flight fetch
  if (poolFetchController) poolFetchController.abort();
  poolFetchController = new AbortController();
  const { signal } = poolFetchController;

  state.pool = [];
  state.poolLoading = true;
  setPoolStatus('loading');

  try {
    const radius = Math.max(parseInt(state.prefs.radius) || 5000, 2000);
    const query  = buildPoolQuery(radius);
    const data   = await runOverpassQuery(query, signal);
    if (signal.aborted) return;

    state.pool = parseRestaurants(data);
    state.pool.forEach(r => { r.openStatus = parseOpeningHours(r.openingHoursRaw); });
    state.poolLoading = false;
    setPoolStatus('ready');
    updateFacets();
  } catch (e) {
    if (e.name === 'AbortError') return;
    console.warn('Pool fetch failed:', e);
    state.poolLoading = false;
    setPoolStatus('');
  }
}

function setPoolStatus(status) {
  const el = document.getElementById('pool-status');
  if (!el) return;
  if (status === 'loading') {
    el.textContent = '· scanning nearby…';
    el.className   = 'pool-status pool-loading';
  } else if (status === 'ready' && state.pool.length) {
    el.textContent = `· ${state.pool.length} nearby`;
    el.className   = 'pool-status';
  } else {
    el.textContent = '';
    el.className   = 'pool-status';
  }
}

function buildPoolQuery(radius) {
  const around = `(around:${radius},${state.lat},${state.lon})`;
  const lines  = [];

  if (state.prefs.breweryMode) {
    lines.push(`  node["craft"="brewery"]${around};`);
    lines.push(`  way["craft"="brewery"]${around};`);
    lines.push(`  node["amenity"="pub"]["microbrewery"="yes"]${around};`);
    lines.push(`  way["amenity"="pub"]["microbrewery"="yes"]${around};`);
  } else if (state.prefs.pubMode) {
    for (const a of ['pub', 'bar']) {
      lines.push(`  node["amenity"="${a}"]${around};`);
      lines.push(`  way["amenity"="${a}"]${around};`);
    }
  } else {
    for (const a of ['restaurant', 'cafe', 'fast_food', 'food_court']) {
      lines.push(`  node["amenity"="${a}"]${around};`);
      lines.push(`  way["amenity"="${a}"]${around};`);
    }
  }

  return `[out:json][timeout:25];\n(\n${lines.join('\n')}\n);\nout center 100;`;
}

// ── Faceted Filtering ──────────────────────────────────────────────────────
//
// After the pool is ready, dim cuisine chips and dining chips that have no
// matching restaurants in the pool given the currently-selected filters.

function updateFacets() {
  if (!state.pool.length || state.poolLoading) return;

  // ── Cuisine facets ──
  // Base: pool filtered by everything except cuisines
  const baseForCuisine = clientFilter(state.pool, { ...state.prefs, cuisines: [] });
  document.querySelectorAll('.option-btn[data-group="cuisines"]').forEach(btn => {
    const v = btn.dataset.value;
    if (v === 'any' || state.prefs.cuisines.includes(v)) {
      btn.classList.remove('dim-facet'); return;
    }
    const has = baseForCuisine.some(r => cuisineMatches(r, v));
    btn.classList.toggle('dim-facet', !has);
  });

  // ── Dining facets ──
  // Base: pool filtered by everything except dinings
  const baseForDining = clientFilter(state.pool, { ...state.prefs, dinings: [] });
  document.querySelectorAll('.option-btn[data-group="dinings"]').forEach(btn => {
    const v = btn.dataset.value;
    if (state.prefs.dinings.includes(v)) {
      btn.classList.remove('dim-facet'); return;
    }
    const has = baseForDining.some(r => diningMatches(r, v));
    btn.classList.toggle('dim-facet', !has);
  });
}

// Client-side filter — used for pool faceting (not the actual Overpass query)
function clientFilter(pool, prefs) {
  return pool.filter(r => {
    if (prefs.cuisines.length > 0 && !prefs.cuisines.some(c => cuisineMatches(r, c))) return false;
    if (prefs.dinings.length  > 0 && !prefs.dinings.some(d => diningMatches(r, d)))   return false;
    if (prefs.openNow && r.openStatus !== null && r.openStatus.isOpen === false)       return false;
    if (prefs.kidsOnly && !r.kidsMenu)                                                 return false;
    const minR = parseFloat(prefs.minRating) || 0;
    if (minR > 0 && r.starRating !== null && r.starRating < minR)                     return false;
    return true;
  });
}

function cuisineMatches(r, cuisine) {
  if (cuisine === 'any') return true;
  const pattern = CUISINE_OSM[cuisine];
  if (!pattern || !r.cuisineRaw) return false;
  return new RegExp(pattern, 'i').test(r.cuisineRaw);
}

function diningMatches(r, style) {
  const a = r.amenityType || '';
  if (style === 'dine-in')  return ['restaurant', 'food_court'].includes(a);
  if (style === 'takeout')  return ['fast_food', 'cafe'].includes(a);
  return true;
}

// ── Main Action ────────────────────────────────────────────────────────────

async function onFindMyFood() {
  const errEl = document.getElementById('search-error');
  errEl.classList.add('hidden');

  if (!state.lat || !state.lon) {
    errEl.textContent = 'Please allow location access or enter your location first.';
    errEl.classList.remove('hidden');
    return;
  }

  showLoading('Searching for restaurants near you…');

  try {
    const results = await fetchRestaurants();
    hideLoading();

    if (!results.length) {
      errEl.textContent = 'No results found. Try a larger distance, different cuisine, or relax some filters.';
      errEl.classList.remove('hidden');
      return;
    }

    state.restaurants = results;
    state.currentRotation = 0;
    initRoulette(results);
    showPage('page-roulette');
  } catch (err) {
    hideLoading();
    errEl.textContent = 'Could not fetch restaurants. Check your connection and try again.';
    errEl.classList.remove('hidden');
    console.error(err);
  }
}

// ── Overpass Search ────────────────────────────────────────────────────────

async function fetchRestaurants() {
  const radius    = parseInt(state.prefs.radius) || 5000;
  const wheelSize = parseInt(state.prefs.wheelSize) || 10;
  const minRating = parseFloat(state.prefs.minRating) || 0;

  // 1. Primary search with all selected filters
  let results = await runSearch(state.prefs.cuisines, radius);

  // 2. If fewer than 3 results, drop cuisine filter
  if (results.length < 3 && state.prefs.cuisines.length > 0) {
    results = await runSearch([], radius);
  }

  // 3. Still fewer than 3 → double the radius
  if (results.length < 3) {
    results = await runSearch([], Math.min(radius * 2, 20000));
  }

  // Attach live data
  results.forEach(r => { r.openStatus = parseOpeningHours(r.openingHoursRaw); });

  // ── Post-filters ──

  let filtered = results;

  // Open now
  if (state.prefs.openNow) {
    const open = filtered.filter(r => r.openStatus?.isOpen === true);
    if (open.length >= 3) filtered = open;
    else filtered.sort((a, b) => (b.openStatus?.isOpen ? 1 : 0) - (a.openStatus?.isOpen ? 1 : 0));
  }

  // Kids friendly
  if (state.prefs.kidsOnly) {
    const kids = filtered.filter(r => r.kidsMenu);
    if (kids.length >= 3) filtered = kids;
  }

  // Minimum rating
  if (minRating > 0) {
    const rated = filtered.filter(r => r.starRating !== null && r.starRating >= minRating);
    if (rated.length >= 3) {
      filtered = rated;
    } else {
      filtered.sort((a, b) => {
        const aQ = (a.starRating !== null && a.starRating >= minRating) ? 1 : 0;
        const bQ = (b.starRating !== null && b.starRating >= minRating) ? 1 : 0;
        return bQ - aQ;
      });
    }
  }

  return filtered.slice(0, wheelSize);
}

async function runSearch(cuisines, radius) {
  const query = buildOverpassQuery(cuisines, radius);
  const data  = await runOverpassQuery(query, null);
  return parseRestaurants(data);
}

function buildOverpassQuery(cuisines, radius) {
  const around = `(around:${radius},${state.lat},${state.lon})`;

  // Build cuisine regex (OR of all selected cuisines)
  const patterns = cuisines.map(c => CUISINE_OSM[c]).filter(Boolean).join('|');
  const cTag     = patterns ? `["cuisine"~"${patterns}",i]` : '';

  const lines = [];

  if (state.prefs.breweryMode) {
    lines.push(`  node["craft"="brewery"]${around};`);
    lines.push(`  way["craft"="brewery"]${around};`);
    lines.push(`  node["amenity"="pub"]["microbrewery"="yes"]${around};`);
    lines.push(`  way["amenity"="pub"]["microbrewery"="yes"]${around};`);
    if (state.prefs.pubMode) {
      lines.push(`  node["amenity"="pub"]${around};`);
      lines.push(`  way["amenity"="bar"]${around};`);
    }
  } else if (state.prefs.pubMode) {
    for (const a of ['pub', 'bar']) {
      lines.push(`  node["amenity"="${a}"]${cTag}${around};`);
      lines.push(`  way["amenity"="${a}"]${cTag}${around};`);
    }
  } else {
    // Determine amenity types from dining selections (empty = all)
    const amenities = new Set();
    if (state.prefs.dinings.length === 0 || state.prefs.dinings.includes('dine-in')) {
      amenities.add('restaurant'); amenities.add('food_court');
    }
    if (state.prefs.dinings.length === 0 || state.prefs.dinings.includes('takeout')) {
      amenities.add('fast_food'); amenities.add('cafe');
    }
    if (amenities.size === 0) {
      ['restaurant', 'cafe', 'fast_food', 'food_court'].forEach(a => amenities.add(a));
    }
    for (const a of amenities) {
      lines.push(`  node["amenity"="${a}"]${cTag}${around};`);
      lines.push(`  way["amenity"="${a}"]${cTag}${around};`);
    }
  }

  return `[out:json][timeout:30];\n(\n${lines.join('\n')}\n);\nout center 60;`;
}

async function runOverpassQuery(query, signal) {
  const opts = {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ query }),
  };
  if (signal) opts.signal = signal;
  const res = await fetch('/api/overpass', opts);
  if (!res.ok) throw new Error(`Overpass proxy ${res.status}`);
  return res.json();
}

// ── Restaurant Parsing ─────────────────────────────────────────────────────

function parseRestaurants(data) {
  if (!data.elements) return [];
  const seen = new Set();
  const out  = [];
  for (const el of data.elements) {
    if (!el.tags?.name) continue;
    const key = el.tags.name.toLowerCase().replace(/\s/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id:              el.id,
      name:            el.tags.name,
      lat:             el.lat  ?? el.center?.lat,
      lon:             el.lon  ?? el.center?.lon,
      cuisine:         formatCuisine(el.tags.cuisine),
      cuisineRaw:      el.tags.cuisine || '',
      amenityType:     el.tags.amenity || el.tags.craft || '',
      address:         buildAddress(el.tags),
      openingHoursRaw: el.tags.opening_hours || null,
      openStatus:      null,
      starRating:      parseStarRating(el.tags),
      kidsMenu:        kidsTag(el.tags),
      score:           scoreRestaurant(el.tags),
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

function kidsTag(tags) {
  return ['yes', '1', 'true'].includes(
    (tags.kids_menu || tags.children_menu || tags.family_friendly || '').toLowerCase()
  );
}

function scoreRestaurant(tags) {
  let s = 0;
  if (tags.name) s += 3;
  if (tags['addr:street'] || tags['addr:housenumber']) s += 2;
  if (tags.cuisine) s += 2;
  if (tags.phone || tags['contact:phone']) s += 1;
  if (tags.website || tags['contact:website']) s += 1;
  if (tags.opening_hours) s += 1;
  if (tags.stars || tags.rating) s += 1;
  return s;
}

function buildAddress(tags) {
  const parts = [];
  if (tags['addr:housenumber'] && tags['addr:street'])
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  else if (tags['addr:street'])
    parts.push(tags['addr:street']);
  if (tags['addr:city'])  parts.push(tags['addr:city']);
  if (tags['addr:state']) parts.push(tags['addr:state']);
  return parts.join(', ') || 'Address not available';
}

function formatCuisine(raw) {
  if (!raw) return 'Restaurant';
  return raw.split(';')[0].split('_').join(' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Star Rating ────────────────────────────────────────────────────────────

function parseStarRating(tags) {
  const raw = tags.stars || tags.rating;
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(',', '.'));
  if (isNaN(n) || n < 1 || n > 5) return null;
  return Math.round(n * 10) / 10;
}

function renderStars(rating) {
  if (rating === null) return '';
  const full = Math.floor(rating);
  const half = rating - full >= 0.3 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half) + ` ${rating.toFixed(1)}`;
}

// ── Opening Hours Parser ───────────────────────────────────────────────────

function tMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const OSM_DAY = { Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6, Su: 0 };

function dayMatchesRule(part, today) {
  if (!part) return true;
  const rng = part.match(/^(Mo|Tu|We|Th|Fr|Sa|Su)\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su)$/);
  if (rng) {
    const a = OSM_DAY[rng[1]], b = OSM_DAY[rng[2]];
    return a <= b ? (today >= a && today <= b) : (today >= a || today <= b);
  }
  return part.split(',').map(d => d.trim()).some(d => OSM_DAY[d] === today);
}

function parseOpeningHours(raw) {
  if (!raw) return null;
  const s = raw.trim();
  if (s === '24/7') return { isOpen: true, label: 'Open 24 / 7' };
  const now = new Date();
  const today = now.getDay();
  const nowM  = now.getHours() * 60 + now.getMinutes();
  let isOpen = false, ranges = [];
  for (const seg of s.split(';').map(r => r.trim()).filter(Boolean)) {
    if (/\boff\b/i.test(seg) || /\b(PH|SH)\b/.test(seg)) continue;
    const tIdx = seg.search(/\d{2}:\d{2}/);
    if (tIdx < 0) continue;
    const dayPart = seg.slice(0, tIdx).trim().replace(/[,\s]+$/, '');
    if (!dayMatchesRule(dayPart, today)) continue;
    const rr = seg.slice(tIdx).match(/\d{2}:\d{2}-\d{2}:\d{2}/g) || [];
    ranges.push(...rr);
    for (const r of rr) {
      const [o, c] = r.split('-').map(tMins);
      if (c <= o) { if (nowM >= o || nowM < c) isOpen = true; }
      else        { if (nowM >= o && nowM < c) isOpen = true; }
    }
  }
  if (!ranges.length) return { isOpen: false, label: 'Closed today' };
  if (isOpen) {
    for (const r of ranges) {
      const [o, c] = r.split('-').map(tMins);
      const crosses = c <= o;
      const inRange = crosses ? (nowM >= o || nowM < c) : (nowM >= o && nowM < c);
      if (inRange) return { isOpen: true, label: `Open now · closes ${r.split('-')[1]}` };
    }
    return { isOpen: true, label: 'Open now' };
  }
  const next = ranges.find(r => tMins(r.split('-')[0]) > nowM);
  if (next) return { isOpen: false, label: `Closed · opens at ${next.split('-')[0]}` };
  return { isOpen: false, label: `Closed · was open until ${ranges.at(-1).split('-')[1]}` };
}

// ── Roulette Wheel ─────────────────────────────────────────────────────────

function initRoulette(restaurants) {
  const size = Math.min(window.innerWidth - 40, 480);
  canvas.width = canvas.height = size;
  wheelWrapper.style.width = wheelWrapper.style.height = size + 'px';
  wheelWrapper.style.transition = 'none';
  wheelWrapper.style.transform  = 'rotate(0deg)';
  state.currentRotation = 0;
  drawWheel(restaurants);
  document.getElementById('result-card').classList.add('hidden');
  const spin = document.getElementById('btn-spin');
  spin.disabled = false;
  spin.textContent = 'SPIN';
}

function drawWheel(rests) {
  const N  = rests.length;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const R  = cx - 4;
  const sa = (2 * Math.PI) / N;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < N; i++) {
    const start = i * sa - Math.PI / 2;
    const end   = start + sa;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();
    ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + sa / 2);
    const fs = Math.max(8, Math.min(13, Math.floor(R * 0.11)));
    ctx.font      = `bold ${fs}px Inter, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur  = 3;
    const max   = Math.floor((R - 30) / (fs * 0.55));
    const name  = rests[i].name;
    const label = name.length > max ? name.slice(0, max - 1) + '…' : name;
    ctx.fillText(label, R - 14, fs * 0.38);
    ctx.restore();
  }

  // Hub
  ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
  ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#FF7A00'; ctx.fill();
}

// ── Spin Logic ─────────────────────────────────────────────────────────────

function onSpin() {
  if (state.isSpinning) return;
  startSpin(Math.floor(Math.random() * state.restaurants.length));
}

function onSpinAgain() {
  document.getElementById('result-card').classList.add('hidden');
  if (state.isSpinning) return;
  startSpin(Math.floor(Math.random() * state.restaurants.length));
}

function startSpin(winnerIdx) {
  state.isSpinning = true;
  document.getElementById('btn-spin').disabled = true;
  document.getElementById('result-card').classList.add('hidden');

  const sa  = 360 / state.restaurants.length;
  const wc  = (winnerIdx + 0.5) * sa;
  const tr  = ((360 - wc) % 360 + 360) % 360;
  const cr  = ((state.currentRotation % 360) + 360) % 360;
  let delta = (tr - cr + 360) % 360;
  if (delta < 1) delta += 360;

  const newRot = state.currentRotation + (6 + Math.floor(Math.random() * 3)) * 360 + delta;
  wheelWrapper.style.transition = 'none';
  void wheelWrapper.offsetWidth;
  wheelWrapper.style.transition = 'transform 6.5s cubic-bezier(0.23, 1, 0.32, 1)';
  wheelWrapper.style.transform  = `rotate(${newRot}deg)`;
  state.currentRotation = newRot;

  setTimeout(() => {
    state.isSpinning = false;
    showResult(state.restaurants[winnerIdx]);
  }, 6800);
}

// ── Result Display ─────────────────────────────────────────────────────────

function showResult(r) {
  document.getElementById('result-name').textContent    = r.name;
  document.getElementById('result-cuisine').textContent = '🍴 ' + r.cuisine;
  document.getElementById('result-address').textContent = '📍 ' + r.address;

  // Price badge — show selected price range or nothing if unspecified
  const priceBadge = document.getElementById('result-price');
  if (state.prefs.prices.length > 0) {
    const sorted = [...state.prefs.prices].map(Number).sort((a, b) => a - b);
    priceBadge.textContent = sorted.map(p => '$'.repeat(p)).join(' · ');
    priceBadge.classList.remove('hidden');
  } else {
    priceBadge.classList.add('hidden');
  }

  // Hours badge
  const hoursBadge = document.getElementById('result-hours-badge');
  const hoursLabel = document.getElementById('result-hours-label');
  if (r.openStatus) {
    hoursBadge.textContent = r.openStatus.isOpen ? '🟢 Open now' : '🔴 Closed';
    hoursBadge.className   = 'result-badge result-badge-hours ' + (r.openStatus.isOpen ? 'badge-open' : 'badge-closed');
    hoursBadge.classList.remove('hidden');
    hoursLabel.textContent = r.openStatus.label;
    hoursLabel.classList.remove('hidden');
  } else {
    hoursBadge.classList.add('hidden');
    hoursLabel.classList.add('hidden');
  }

  // Rating badge
  const ratingBadge = document.getElementById('result-rating-badge');
  if (r.starRating !== null) {
    ratingBadge.textContent = renderStars(r.starRating);
    ratingBadge.classList.remove('hidden');
  } else {
    ratingBadge.classList.add('hidden');
  }

  // Kids badge
  document.getElementById('result-kids-badge').classList.toggle('hidden', !r.kidsMenu);

  // Maps URL
  const mapsUrl = r.lat && r.lon
    ? `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + ' ' + r.address)}`;
  document.getElementById('btn-maps').href = mapsUrl;

  const card = document.getElementById('result-card');
  card.classList.remove('hidden');
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}
