/**
 * Address of the SplitEase backend, from API_URL. Both `https://api.example.com` and
 * `https://api.example.com/api/v1` are accepted: routes add `/api/v1/...` themselves, so a
 * trailing `/api/v1` is dropped here instead of producing `/api/v1/api/v1/...`.
 */
export const BACKEND_URL = (process.env.API_URL ?? 'http://localhost:9890')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api\/v1$/i, '')
  .replace(/\/+$/, '');
