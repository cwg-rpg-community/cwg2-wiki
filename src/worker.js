// CWG RPG Wiki on the shared CWG domain: https://cwg.echowrought.com/wiki
// (the CWG Homepage is at the root, the leaderboard at /leaderboard, the admin panel at /admin_panel).
//
// The wiki is a static site (index.html + js/, img/, fonts/, *.js data) with hash routing (#items, #zones/…)
// and only relative file paths, so all this Worker does is strip the /wiki prefix and hand the rest to the
// static assets. The same files still work at a domain root (GitHub Pages, `wrangler dev`).
const BASE_PATH = "/wiki";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // /wiki -> /wiki/ so the page's relative js/img/fonts paths resolve under /wiki/
    if (url.pathname === BASE_PATH) return Response.redirect(`${url.origin}${BASE_PATH}/${url.search}`, 301);
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
