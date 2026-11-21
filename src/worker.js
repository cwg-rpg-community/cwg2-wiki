// CWG RPG Wiki on the shared CWG domain: https://cwg.echowrought.com/wiki
// (the CWG Homepage is at the root, the leaderboard at /leaderboard, the admin panel at /admin_panel).
//
// The wiki is a static site (index.html + js/, img/, fonts/, *.js data) with hash routing (#items, #zones/…)
// and only relative file paths, so all this Worker does is strip the /wiki prefix and hand the rest to the
// static assets. The same files still work at a domain root (GitHub Pages, `wrangler dev`).
//
// Maintenance switch: admin panel (cwg.echowrought.com/admin_panel → Development → Wiki). It's stored in the
// leaderboard's database, so this Worker asks the leaderboard Worker (service binding LEADERBOARD) at most
// every 10 seconds. While it's on, every page shows the maintenance page (HTTP 503). /wiki/maintenance always
// shows it, as a preview. If the leaderboard can't be reached, the wiki stays up.
import PAGE from "./maintenance.html"; // bundled as text by Wrangler

const BASE_PATH = "/wiki";
const CHECK_MS = 10_000;
let cached = { on: false, at: 0 };

async function maintenanceOn(env) {
  if (Date.now() - cached.at < CHECK_MS) return cached.on;
  let on = false;
  try {
    if (env.LEADERBOARD) {
      const r = await env.LEADERBOARD.fetch("https://leaderboard/api/maintenance-status?site=wiki");
      if (r.ok) on = !!(await r.json()).on;
    }
  } catch { on = false; }
  cached = { on, at: Date.now() };
  return on;
}

const maintenancePage = (status) => new Response(PAGE, { status, headers: {
  "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex",
  ...(status === 503 ? { "Retry-After": "300" } : {}) } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // /wiki -> /wiki/ so the page's relative js/img/fonts paths resolve under /wiki/
    if (url.pathname === BASE_PATH) return Response.redirect(`${url.origin}${BASE_PATH}/${url.search}`, 301);
    const inside = url.pathname.startsWith(BASE_PATH + "/") ? url.pathname.slice(BASE_PATH.length) : url.pathname;
    if (inside === "/maintenance" || inside === "/maintenance/") return maintenancePage(200);
    if (await maintenanceOn(env)) return maintenancePage(503);
    if (url.pathname.startsWith(BASE_PATH + "/")) {
      const inner = new URL(url);
      inner.pathname = url.pathname.slice(BASE_PATH.length);
      const response = await env.ASSETS.fetch(new Request(inner, request));
      // put the prefix back on redirects from the assets (e.g. /index.html -> /)
      const loc = response.headers.get("Location");
      if (loc && loc.startsWith("/") && !loc.startsWith("//")) {
        const r = new Response(response.body, response);
        r.headers.set("Location", BASE_PATH + loc);
        return r;
      }
      return response;
    }
    return env.ASSETS.fetch(request);   // root (wrangler dev)
  },
};
