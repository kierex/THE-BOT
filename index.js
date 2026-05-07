const { spawn } = require("child_process");
const http      = require("http");
const fs        = require("fs-extra");
const path      = require("path");
const url       = require("url");
const logger    = require("./utils/log");

const PORT    = process.env.PORT || 5000;
const WEB_DIR = path.join(__dirname, "web");
const CMDS_DIR  = path.join(__dirname, "modules/commands");
const EVTS_DIR  = path.join(__dirname, "modules/events");

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

// ── SoundCloud init (legacy - kept for compatibility) ─────────────────────────
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

// ── Build file list for dashboard ─────────────────────────────────────────────
function getBotFiles() {
  const files = [];
  try {
    const cmdFiles = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith('.js'));
    for (const f of cmdFiles)
      files.push({ name: f, path: `modules/commands/${f}`, type: 'command' });
  } catch {}
  try {
    const evtFiles = fs.readdirSync(EVTS_DIR).filter(f => f.endsWith('.js'));
    for (const f of evtFiles)
      files.push({ name: f, path: `modules/events/${f}`, type: 'event' });
  } catch {}
  const rootFiles = ['index.js', 'mirai.js', 'package.json', 'config.json', 'render.yaml', 'railway.toml'];
  for (const f of rootFiles) {
    if (fs.existsSync(path.join(__dirname, f)))
      files.push({ name: f, path: f, type: 'core' });
  }
  return files;
}

// ── Build command list for dashboard ─────────────────────────────────────────
function getCommandList() {
  const cmds = [];
  try {
    const files = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith('.js'));
    for (const f of files) {
      try {
        const fp  = path.join(CMDS_DIR, f);
        const mod = require(fp);
        if (mod?.config) {
          cmds.push({
            name:       mod.config.name,
            category:   mod.config.commandCategory || 'Other',
            permission: mod.config.hasPermssion ?? 0,
            description: mod.config.description || ''
          });
        }
      } catch {}
    }
  } catch {}
  return cmds;
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

  // ── GET / → Bot dashboard ──────────────────────────────────────────────────
  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = fs.readFileSync(path.join(WEB_DIR, "index.html"), "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(html);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not found");
    }
  }

  // ── GET /api/status → bot status JSON ─────────────────────────────────────
  if (pathname === "/api/status") {
    const mem    = process.memoryUsage();
    const cmds   = getCommandList();
    const files  = getBotFiles();
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      status:       "online",
      botName:      "Mirai Bot V5",
      version:      "5.0.0",
      team:         "TEAM STARTCOPE BETA",
      prefix:       "!",
      platform:     IS_SERVERLESS ? (IS_VERCEL ? "vercel" : "netlify") : "persistent",
      node:         process.version,
      uptime:       process.uptime(),
      memoryMB:     (mem.rss / 1024 / 1024).toFixed(1),
      commandCount: cmds.length,
      fileCount:    files.length,
      commands:     cmds,
      files,
    }));
  }

  // ── GET /api/commands → commands JSON ─────────────────────────────────────
  if (pathname === "/api/commands") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ commands: getCommandList() }));
  }

  // ── GET /health → legacy health check ─────────────────────────────────────
  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      status:  "online",
      uptime:  process.uptime(),
      bot:     "Mirai Bot V5",
      team:    "TEAM STARTCOPE BETA",
    }));
  }

  // ── GET /api/search?q=... → SoundCloud search (kept for compatibility) ─────
  if (pathname === "/api/search") {
    const q = query.q;
    if (!q) { res.writeHead(400, {"Content-Type":"application/json"}); return res.end(JSON.stringify({error:"Missing q"})); }
    try {
      await ensureSC();
      const play    = require("play-dl");
      const results = await play.search(q, { source: { soundcloud: "tracks" }, limit: 10 });
      const mapped  = results.map(r => ({
        title:     r.name || "Unknown",
        url:       r.url,
        duration:  r.durationInSec || 0,
        thumbnail: r.thumbnails?.[0]?.url || "",
        artist:    r.user?.name || "Unknown",
      }));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ results: mapped }));
    } catch(e) {
      res.writeHead(500, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: e.message }));
    }
  }

  // ── GET /api/download → audio download ────────────────────────────────────
  if (pathname === "/api/download") {
    const trackUrl = query.url;
    const title    = (query.title || "audio").replace(/[^\w\s\-]/g, "").trim();
    if (!trackUrl) { res.writeHead(400,{"Content-Type":"text/plain"}); return res.end("Missing url"); }
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
      if (!res.headersSent) {
        res.writeHead(500, {"Content-Type":"application/json"});
        res.end(JSON.stringify({ error: e.message }));
      }
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

server.on("error", err => {
  if (err.code === "EADDRINUSE") logger(`Port ${PORT} in use`, "[ SERVER ]");
  else logger(`Server error: ${err.message}`, "[ SERVER ]");
});

server.listen(PORT, "0.0.0.0", () => {
  logger(`Web dashboard running on port ${PORT}`, "[ SERVER ]");
  if (IS_SERVERLESS) logger("Serverless mode — web only (no bot)", "[ SERVER ]");
});

// ── Bot process (persistent platforms only) ───────────────────────────────────
function startBot(message) {
  if (message) logger(message, "[ Starting ]");
  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "mirai.js"], {
    cwd: __dirname, stdio: "inherit", shell: true
  });
  child.on("close", code => {
    if (code !== 0 || (global.countRestart && global.countRestart < 5)) {
      global.countRestart = (global.countRestart || 0) + 1;
      startBot("Restarting...");
    }
  });
  child.on("error", err => logger("Error: " + JSON.stringify(err), "[ Starting ]"));
}

if (!IS_SERVERLESS) startBot();
else logger("Serverless — bot disabled. Web dashboard active.", "[ INFO ]");
