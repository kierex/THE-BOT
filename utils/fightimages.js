/**
 * fightimages.js — Free anime fighting image/GIF fetcher
 * Sources: nekos.best → waifu.pics → some-random-api (fallback chain)
 * Downloads to temp file, caller is responsible for cleanup.
 * TEAM STARTCOPE BETA
 */
const axios = require('axios');
const fs    = require('fs-extra');
const path  = require('path');

const TEMP_DIR = path.join(process.cwd(), 'utils', 'data', 'fight_temp');
try { fs.ensureDirSync(TEMP_DIR); } catch(e) {}

// ── Category maps per API ─────────────────────────────────────────────────────
const NEKOS_BEST_CATS = ['kick', 'punch', 'shoot', 'nosebleed', 'slap', 'stab'];
const WAIFU_PICS_CATS = ['kick', 'punch', 'slap', 'pat'];
const SRA_CATS        = ['punch', 'slap'];

function randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── nekos.best v2 ─────────────────────────────────────────────────────────────
async function fromNekosBest(category) {
    const cat = NEKOS_BEST_CATS.includes(category) ? category : randFrom(NEKOS_BEST_CATS);
    const res = await axios.get(`https://nekos.best/api/v2/${cat}`, { timeout: 10000 });
    const url = res.data?.results?.[0]?.url;
    if (!url) throw new Error('No URL from nekos.best');
    return { url, source: 'nekos.best', category: cat };
}

// ── waifu.pics ────────────────────────────────────────────────────────────────
async function fromWaifuPics(category) {
    const cat = WAIFU_PICS_CATS.includes(category) ? category : randFrom(WAIFU_PICS_CATS);
    const res = await axios.get(`https://api.waifu.pics/sfw/${cat}`, { timeout: 10000 });
    const url = res.data?.url;
    if (!url) throw new Error('No URL from waifu.pics');
    return { url, source: 'waifu.pics', category: cat };
}

// ── some-random-api ───────────────────────────────────────────────────────────
async function fromSomeRandomApi(category) {
    const cat = SRA_CATS.includes(category) ? category : randFrom(SRA_CATS);
    const res = await axios.get(`https://some-random-api.com/animu/${cat}`, { timeout: 10000 });
    const url = res.data?.link;
    if (!url) throw new Error('No URL from some-random-api');
    return { url, source: 'some-random-api', category: cat };
}

// ── Download image to temp file ───────────────────────────────────────────────
async function downloadImage(url) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    if (!res.data || res.data.byteLength < 500) throw new Error('Image too small');

    // Detect extension from content-type or URL
    const ct  = res.headers['content-type'] || '';
    const ext = ct.includes('gif') ? '.gif' : ct.includes('png') ? '.png' : '.jpg';
    const fp  = path.join(TEMP_DIR, `fight_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
    fs.writeFileSync(fp, Buffer.from(res.data));
    return fp;
}

// ── Main export — returns local file path ─────────────────────────────────────
/**
 * getFightImage(category?) → { filePath, source, category }
 * category: 'kick' | 'punch' | 'shoot' | 'slap' | 'stab' | 'nosebleed' | random
 */
async function getFightImage(category = null) {
    const cat = category || randFrom(NEKOS_BEST_CATS);
    const sources = [
        () => fromNekosBest(cat),
        () => fromWaifuPics(cat),
        () => fromSomeRandomApi(cat),
    ];

    for (const source of sources) {
        try {
            const info = await source();
            const filePath = await downloadImage(info.url);
            return { filePath, source: info.source, category: info.category };
        } catch(e) {
            // try next source
        }
    }
    return null; // all sources failed
}

function cleanupLater(fp, delayMs = 300000) {
    setTimeout(() => { try { fs.removeSync(fp); } catch {} }, delayMs);
}

module.exports = { getFightImage, cleanupLater };
