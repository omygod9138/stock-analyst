// Cloudflare Worker: relays 鉅亨網 (cnyes) per-stock news to the stock-analyst page.
// 鉅亨網 only lets its own sites read this feed from a browser, so the page asks this Worker instead.
// Only the one feed is relayed (no open proxy), and answers are cached at the edge for 10 minutes.
//   GET https://<your-worker>.workers.dev/?code=2330&page=1
//   -> { total, page, last, items: [{ id, title, at, cat }] }   (at = unix seconds)
const FEED = "https://api.cnyes.com/media/api/v1/newslist/TWS:{code}:STOCK/symbolNews";
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" };

export default {
  async fetch(req, env, ctx) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    const u = new URL(req.url), code = (u.searchParams.get("code") || "").toUpperCase(), page = Math.max(1, Math.min(50, +u.searchParams.get("page") || 1));
    if (!/^[0-9A-Z]{4,6}$/.test(code)) return json({ error: "bad code" }, 400);

    const cache = typeof caches !== "undefined" ? caches.default : null, key = new Request(u.origin + "/?code=" + code + "&page=" + page);
    const hit = cache && await cache.match(key);
    if (hit) return hit;

    const r = await fetch(FEED.replace("{code}", code) + "?limit=30&page=" + page, { headers: { "user-agent": "Mozilla/5.0", origin: "https://www.cnyes.com" } });
    if (!r.ok) return json({ error: "cnyes HTTP " + r.status }, 502);
    const it = (await r.json()).items || {};
    const res = json({
      total: it.total || 0, page: it.current_page || page, last: it.last_page || page,
      items: (it.data || []).map(x => ({ id: x.newsId, title: x.title, at: x.publishAt, cat: x.categoryName || "" }))
    }, 200, { "cache-control": "public, max-age=600" });
    if (cache && ctx) ctx.waitUntil(cache.put(key, res.clone()));
    return res;
  }
};

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", ...CORS, ...extra } });
}
