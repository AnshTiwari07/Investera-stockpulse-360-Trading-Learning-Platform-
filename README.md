# Investara

Formerly "Zerodha" clone. This project has been rebranded to Investara across the application, server, and UI.

## Rebranding Summary

- Updated package names to `investara-clone-client` and `investara-clone-server`.
- Changed UI branding (Navbar, Footer, Login) to display "Investara".
- Updated public page title to "Investara Trading Dashboard".
- Renamed fallback image asset from `zerodha.png` to `investara.png`.
- Switched default MongoDB database name to `investara-clone`.

## Development

- Client: `cd zerodha-clone/client && npm start`
- Server: `cd zerodha-clone/server && npm run dev`

### Networking: Handling Aborted Requests

Symptom

- Browser console shows `net::ERR_ABORTED` for requests like `/api/stocks/<SYMBOL>/history?range=7D` or static assets during navigations/hot reloads.

Root Cause

- When navigating away or when React Fast Refresh rerenders components, in-flight XHR requests can be canceled by the browser, resulting in aborted network calls.

Resolution Implemented

- Client requests that fetch per-symbol sparkline and chart history use `AbortController` and are canceled on component unmount or rapid symbol changes.
- Axios default timeout set to `10s` to prevent hanging requests.
- Errors are handled gracefully:
  - Canceled requests are swallowed and replaced with empty data to keep UI responsive.
  - Genuine failures show a friendly alert without breaking the page.

Preventive Measures

- Avoid refetch loops tied to rapid state changes; fetch once and simulate live updates client-side.
- Cancel outstanding requests in cleanup functions within `useEffect`.
- Use per-request try/catch (or `Promise.allSettled`) so one failing request doesn’t break the batch.

Testing the Fix

- Unit tests ensure:
  - Error alert appears when `/api/stocks` fails.
  - Empty state renders when no stocks are available.
  - Canceled sparkline history requests do not surface as UI errors.
  
Run:

```
cd zerodha-clone/client
npm test -- --watchAll=false
```

## Build

- Client build: `cd zerodha-clone/client && npm run build`

## Notes

- No CI/CD or API documentation files were present to update.
- If you use environment variables, ensure `.env` reflects Investara naming as needed.
