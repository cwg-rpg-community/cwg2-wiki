## What is this

This is a temporary copy of wiki for Warcraft 3 RPG map CWG RPG - Covenant of Warring Gods by TheMidLane.

Original author of this wiki is player named Fufu. The original link is currently down: https://cwg-rpg.github.io/ (error 404).

The link to the live site: https://cwg.echowrought.com/wiki/ (previously https://cwg-rpg-wiki.github.io/)

## Hosting

Cloudflare Worker `cwg2-wiki` (`wrangler.jsonc`, `src/worker.js`), on the shared CWG domain:

| Site | Address |
|------|---------|
| CWG Homepage | https://cwg.echowrought.com |
| Leaderboard | https://cwg.echowrought.com/leaderboard |
| Admin panel | https://cwg.echowrought.com/admin_panel |
| Wiki (this repo) | https://cwg.echowrought.com/wiki |

The site is static and uses hash routing (`#items`, `#zones/...`) and relative file paths, so the Worker only strips the `/wiki` prefix and serves the repo's files as static assets. `.assetsignore` keeps repo-only files (`src/`, `docs/`, this README, `wrangler.jsonc`, ...) off the site. There is no workers.dev address.

Maintenance mode: switched in the admin panel (Development → Wiki). The Worker asks the leaderboard Worker (service binding `LEADERBOARD`) at most every 10 seconds and, while it's on, shows `src/maintenance.html` (HTTP 503) on every page. Preview: https://cwg.echowrought.com/wiki/maintenance. Deploy the leaderboard first (it answers `/api/maintenance-status`).

```sh
npm install
npx wrangler deploy        # or: npm run deploy
npm run dev                # local preview at http://localhost:8787/wiki/
```

`cwg.echowrought.com` must have a proxied DNS record in the `echowrought.com` zone (the homepage's Custom Domain creates it).

Saved settings (planner, stat bar, guide progress) are kept in the browser per site address, so they don't move over from the github.io address by themselves: see [docs/transfer.md](docs/transfer.md).
