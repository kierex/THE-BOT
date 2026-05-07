const { spawn } = require("child_process");
const http      = require("http");
const https     = require("https");
const fs        = require("fs-extra");
const path      = require("path");
const url       = require("url");
const logger    = require("./utils/log");

const PORT    = process.env.PORT || 5000;
const WEB_DIR = path.join(__dirname, "web");
const CMDS_DIR  = path.join(__dirname, "modules/commands");
const EVTS_DIR  = path.join(__dirname, "modules/events");
const GAMEDB_PATH = path.join(__dirname, "utils/data/gamedb.json");

const IS_VERCEL     = !!process.env.VERCEL;
const IS_NETLIFY    = !!process.env.NETLIFY;
const IS_SERVERLESS = IS_VERCEL || IS_NETLIFY;

// ── APPSTATE from environment variable ───────────────────────────────────────
function writeAppstateFromEnv() {
  const raw = process.env.APPSTATE;
  if (!raw) return;
  const dest = path.join(__dirname, "appstate.json");
  if (fs.existsSync(dest)) return;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Must be JSON array");
    fs.writeFileSync(dest, JSON.stringify(parsed, null, 2));
    logger("Written from APPSTATE env var ✅", "[ APPSTATE ]");
  } catch(e) {
    logger("Invalid APPSTATE: " + e.message, "[ APPSTATE ]");
  }
}
writeAppstateFromEnv();

// ── Self-ping keep-alive (prevents Render/Railway free tier sleeping) ─────────
function startKeepAlive() {
  const deployUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.RAILWAY_STATIC_URL  ||
    process.env.KOYEB_PUBLIC_DOMAIN  ||
    null;

  if (!deployUrl) return;

  const pingUrl  = deployUrl.replace(/\/$/, '') + '/health';
  const interval = 13 * 60 * 1000; // 13 minutes — Render sleeps after 15

  setInterval(() => {
    try {
      const lib = pingUrl.startsWith('https') ? https : http;
      lib.get(pingUrl, res => {
        logger(`Keep-alive ping → ${res.statusCode}`, "[ PING ]");
      }).on('error', () => {});
    } catch(e) {}
  }, interval);

  logger(`Keep-alive started → ${pingUrl} every 13min`, "[ PING ]");
}
startKeepAlive();

// ── SoundCloud init (legacy) ──────────────────────────────────────────────────
let scReady = false;
async function ensureSC() {
  if (scReady) return;
  try {
    const play = require("play-dl");
    const id   = await play.getFreeClientID();
    await play.setToken({ soundcloud: { client_id: id } });
    scReady = true;
  } catch(e) {}
}
ensureSC();

// ── Gamedb helpers ─────────────────────────────────────────────────────────────
function readGameDB() {
  try {
    if (!fs.existsSync(GAMEDB_PATH)) return { players: {} };
    return JSON.parse(fs.readFileSync(GAMEDB_PATH, 'utf8'));
  } catch(e) { return { players: {} }; }
}

function getLeaderboard(limit = 20) {
  const db = readGameDB();
  return Object.entries(db.players || {})
    .filter(([, p]) => p.registered)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => (b.coins || 0) - (a.coins || 0))
    .slice(0, limit);
}

function getGameStats() {
  const db = readGameDB();
  const players = Object.values(db.players || {}).filter(p => p.registered);
  const totalGames  = players.reduce((s, p) => s + (p.gamesPlayed || 0), 0);
  const totalCoins  = players.reduce((s, p) => s + (p.coins || 0), 0);
  const totalWins   = players.reduce((s, p) => s + (p.wins || 0), 0);
  return { totalPlayers: players.length, totalGames, totalCoins, totalWins };
}

// ── Build file list for dashboard ─────────────────────────────────────────────
function getBotFiles() {
  const files = [];
  try {
    fs.readdirSync(CMDS_DIR).filter(f => f.endsWith('.js'))
      .forEach(f => files.push({ name: f, path: `modules/commands/${f}`, type: 'command' }));
  } catch {}
  try {
    fs.readdirSync(EVTS_DIR).filter(f => f.endsWith('.js'))
      .forEach(f => files.push({ name: f, path: `modules/events/${f}`, type: 'event' }));
  } catch {}
  ['index.js','mirai.js','package.json','config.json','render.yaml','railway.toml']
    .forEach(f => {
      if (fs.existsSync(path.join(__dirname, f)))
        files.push({ name: f, path: f, type: 'core' });
    });
  return files;
}

function getCommandList() {
  const cmds = [];
  try {
    fs.readdirSync(CMDS_DIR).filter(f => f.endsWith('.js')).forEach(f => {
      try {
        const mod = require(path.join(CMDS_DIR, f));
        if (mod?.config) cmds.push({
          name:        mod.config.name,
          category:    mod.config.commandCategory || 'Other',
          permission:  mod.config.hasPermssion ?? 0,
          description: mod.config.description || '',
          cooldowns:   mod.config.cooldowns || 3,
        });
      } catch {}
    });
  } catch {}
  return cmds;
}

// ── Serve static web files ────────────────────────────────────────────────────
function serveStatic(res, filepath, contentType) {
  try {
    const data = fs.readFileSync(filepath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

// ── Web request handler ────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const query    = parsed.query;

  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  if (pathname === "/" || pathname === "/index.html") {
    return serveStatic(res, path.join(WEB_DIR, "index.html"), "text/html; charset=utf-8");
  }

  // ── Full bot status ────────────────────────────────────────────────────────
  if (pathname === "/api/status") {
    const mem   = process.memoryUsage();
    const cmds  = getCommandList();
    const files = getBotFiles();
    const stats = getGameStats();
    const cfg   = (() => { try { return require('./config.json'); } catch { return {}; } })();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      status:       "online",
      botName:      cfg.BOTNAME || "THE-BOT V5",
      adminName:    cfg.ADMIN_NAME || "THE GOAT",
      version:      cfg.version || "5.0.0",
      team:         "TEAM STARTCOPE BETA",
      prefix:       cfg.PREFIX || "!",
      platform:     IS_SERVERLESS ? (IS_VERCEL ? "vercel" : "netlify") : "persistent",
      node:         process.version,
      uptime:       process.uptime(),
      uptimeMs:     process.uptime() * 1000,
      memoryMB:     (mem.rss / 1024 / 1024).toFixed(1),
      commandCount: cmds.length,
      fileCount:    files.length,
      commands:     cmds,
      files,
      gameStats:    stats,
    }));
  }

  // ── Leaderboard ────────────────────────────────────────────────────────────
  if (pathname === "/api/leaderboard") {
    const limit = parseInt(query.limit) || 20;
    const lb    = getLeaderboard(Math.min(limit, 50));
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ leaderboard: lb, total: lb.length }));
  }

  // ── All players ────────────────────────────────────────────────────────────
  if (pathname === "/api/players") {
    const db      = readGameDB();
    const players = Object.entries(db.players || {})
      .filter(([, p]) => p.registered)
      .map(([uid, p]) => ({
        uid,
        name:        p.name,
        coins:       p.coins || 0,
        wins:        p.wins || 0,
        losses:      p.losses || 0,
        draws:       p.draws || 0,
        gamesPlayed: p.gamesPlayed || 0,
        winRate:     p.gamesPlayed > 0 ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0',
      }));
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ players, total: players.length }));
  }

  // ── Game DB stats ──────────────────────────────────────────────────────────
  if (pathname === "/api/gamedb") {
    const stats = getGameStats();
    const lb    = getLeaderboard(10);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ stats, leaderboard: lb }));
  }

  // ── Commands only ──────────────────────────────────────────────────────────
  if (pathname === "/api/commands") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ commands: getCommandList() }));
  }

  // ── Health check ──────────────────────────────────────────────────────────
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      status: "online", uptime: process.uptime(), bot: "THE-BOT V5", team: "TEAM STARTCOPE BETA"
    }));
  }

  // ── SoundCloud search ──────────────────────────────────────────────────────
  if (pathname === "/api/search") {
    const q = query.q;
    if (!q) { res.writeHead(400); return res.end(JSON.stringify({error:"Missing q"})); }
    try {
      await ensureSC();
      const play    = require("play-dl");
      const results = await play.search(q, { source: { soundcloud: "tracks" }, limit: 10 });
      const mapped  = results.map(r => ({
        title: r.name || "Unknown", url: r.url,
        duration: r.durationInSec || 0,
        thumbnail: r.thumbnails?.[0]?.url || "",
        artist: r.user?.name || "Unknown",
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ results: mapped }));
    } catch(e) {
      res.writeHead(500); return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ── Audio download ─────────────────────────────────────────────────────────
  if (pathname === "/api/download") {
    const trackUrl = query.url;
    const title    = (query.title || "audio").replace(/[^\w\s\-]/g, "").trim();
    if (!trackUrl) { res.writeHead(400); return res.end("Missing url"); }
    try {
      await ensureSC();
      const play = require("play-dl");
      const info = await play.stream(trackUrl);
      res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${title}.mp3"`,
        "Transfer-Encoding": "chunked",
      });
      info.stream.pipe(res);
      req.on("close", () => { try { info.stream.destroy(); } catch {} });
    } catch(e) {
      if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); }
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: err.message })); }
  });
});

server.on("error", err => {
  if (err.code === "EADDRINUSE") logger(`Port ${PORT} in use`, "[ SERVER ]");
  else logger(`Server error: ${err.message}`, "[ SERVER ]");
});

server.listen(PORT, "0.0.0.0", () => {
  logger(`Web dashboard → http://0.0.0.0:${PORT}`, "[ SERVER ]");
  logger(`Endpoints: / | /health | /api/status | /api/leaderboard | /api/players`, "[ SERVER ]");
  if (IS_SERVERLESS) logger("Serverless mode — web only", "[ SERVER ]");
});

// ── Bot process (persistent platforms only) ───────────────────────────────────
function startBot(message) {
  if (message) logger(message, "[ BOT ]");
  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "mirai.js"], {
    cwd: __dirname, stdio: "inherit", shell: true
  });
  child.on("close", code => {
    logger(`Bot exited (code ${code}) — restarting in 5s...`, "[ BOT ]");
    global.countRestart = (global.countRestart || 0) + 1;
    if (global.countRestart <= 10) {
      setTimeout(() => startBot("Restarting bot..."), 5000);
    } else {
      logger("Max restarts reached — manual intervention needed.", "[ BOT ]");
    }
  });
  child.on("error", err => logger("Spawn error: " + err.message, "[ BOT ]"));
}

if (!IS_SERVERLESS) startBot();
else logger("Serverless — bot disabled. Web dashboard active.", "[ INFO ]");
