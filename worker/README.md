# 鉅亨網 news relay (Cloudflare Worker)

鉅亨網's per-stock news feed only answers browser requests from its own sites, so the News tab reads it through this Worker. Free plan is plenty (100,000 requests/day); answers are cached 10 minutes.

## Deploy (about 3 minutes, no install)

1. Sign up / log in at https://dash.cloudflare.com (free).
2. **Workers & Pages** → **Create** → **Create Worker** (Hello World template) → name it e.g. `cnyes-news` → **Deploy**.
3. **Edit code** → replace everything with [`cnyes-news.js`](cnyes-news.js) → **Deploy**.
4. Copy the URL, e.g. `https://cnyes-news.<you>.workers.dev/`, and open `…/?code=2330` to check it returns JSON.
5. Put that URL in `NEWS_RELAY` in `index.html` (or send it to Claude).

With `NEWS_RELAY` empty, or if the Worker is down, the News tab falls back to FinMind.
