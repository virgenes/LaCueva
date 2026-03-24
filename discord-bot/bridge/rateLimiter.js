const WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS = 10;
const ipMap = new Map();
function getIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string")
        return forwarded.split(",")[0].trim();
    return req.socket.remoteAddress ?? "unknown";
}
export function rateLimiter(req, res, next) {
    const ip = getIp(req);
    const now = Date.now();
    let entry = ipMap.get(ip);
    if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + WINDOW_MS };
        ipMap.set(ip, entry);
    }
    entry.count++;
    if (entry.count > MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.setHeader("Retry-After", retryAfter);
        res.status(429).json({ error: "Too many requests. Slow down, aventurero." });
        return;
    }
    next();
}
//# sourceMappingURL=rateLimiter.js.map