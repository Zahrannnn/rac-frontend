// Production runtime env — deployed as a static file and read before hydration
// (src/app/layout.tsx loads it beforeInteractive). Local development overrides
// these through .env.local: src/shared/config/env.ts gives defined build-time
// values precedence over this file, so localhost keeps pointing at localhost.
//
// Auth is Bearer-token based (the JWT lives in the browser session and rides
// the Authorization header), so no same-origin proxy is needed here.
window.__RUNTIME_CONFIG__ = {
  NEXT_PUBLIC_APP_URL: "https://rac-egypt.mzahran.tech",
  NEXT_PUBLIC_RAC_API_BASE_URL: "https://rac-damp.runasp.net/api/v1",
};
