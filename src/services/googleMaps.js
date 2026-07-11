// Installs Google's official inline bootstrap loader, which exposes
// `google.maps.importLibrary`. Guarded so it only ever installs once, even if
// multiple components on the page call loadGoogleMaps with different keys.
function installBootstrapLoader(apiKey) {
  // eslint-disable-next-line no-unused-expressions
  ;(function (g) {
    let h, a, k
    const p = 'The Google Maps JavaScript API'
    const c = 'google'
    const l = 'importLibrary'
    const q = '__ib__'
    const m = document
    let b = window
    b = b[c] || (b[c] = {})
    const d = b.maps || (b.maps = {})
    const r = new Set()
    const e = new URLSearchParams()
    const u = () =>
      h ||
      (h = new Promise(async (f, n) => {
        a = m.createElement('script')
        e.set('libraries', [...r] + '')
        for (k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k])
        e.set('callback', c + '.maps.' + q)
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e
        d[q] = f
        a.onerror = () => (h = n(Error(p + ' could not load.')))
        a.nonce = m.querySelector('script[nonce]')?.nonce || ''
        m.head.append(a)
      }))
    d[l] ? console.warn(p + ' only loads once. Ignoring:', g) : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)))
  })({ key: apiKey, v: 'weekly' })
}

// Loads the Google Maps JS API and resolves once google.maps.Map is actually
// usable (waits on importLibrary rather than trusting <script> onload, which
// fires before the "maps" library chunk is actually ready). Rejects if
// Google signals an auth/billing failure via the documented gm_authFailure
// hook, or if the library import fails outright.
const loadPromisesByKey = new Map()
export function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps)
  if (loadPromisesByKey.has(apiKey)) return loadPromisesByKey.get(apiKey)

  const promise = new Promise((resolve, reject) => {
    window.gm_authFailure = () => reject(new Error('Google Maps auth/billing failure'))

    if (!window.google?.maps?.importLibrary) installBootstrapLoader(apiKey)

    window.google.maps
      .importLibrary('maps')
      .then(() => resolve(window.google.maps))
      .catch(() => reject(new Error('Google Maps "maps" library failed to import')))
  }).catch((err) => {
    loadPromisesByKey.delete(apiKey) // allow a retry (e.g. after enabling billing) on next call
    throw err
  })

  loadPromisesByKey.set(apiKey, promise)
  return promise
}
