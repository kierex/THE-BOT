/**
 * gamedb.js — Persistent game database (atomic file I/O)
 * TEAM STARTCOPE BETA
 */
const fs   = require('fs-extra');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'utils', 'data', 'gamedb.json');

function loadDB() {
    try {
        fs.ensureDirSync(path.dirname(DATA_PATH));
        if (!fs.existsSync(DATA_PATH)) {
            const init = { players: {}, lastUpdated: 0 };
            fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2));
            return init;
        }
        return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch(e) {
        return { players: {}, lastUpdated: 0 };
    }
}

function saveDB(db) {
    try {
        db.lastUpdated = Date.now();
        fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
    } catch(e) { /* silent */ }
}

function getPlayer(uid) {
    const db = loadDB();
    return db.players[String(uid)] || null;
}

function isRegistered(uid) {
    const p = getPlayer(uid);
    return !!(p && p.registered);
}

function registerPlayer(uid, name) {
    const db = loadDB();
    const id = String(uid);
    if (db.players[id] && db.players[id].registered)
        return { success: false, msg: 'already_registered' };
    db.players[id] = {
        name:         name || 'Player',
        coins:        100,
        wins:         0,
        losses:       0,
        draws:        0,
        gamesPlayed:  0,
        registered:   true,
        registeredAt: Date.now()
    };
    saveDB(db);
    return { success: true };
}

/**
 * recordGame — atomic: updates result + coins in ONE read/write
 * @param {string} uid
 * @param {'win'|'loss'|'draw'} result
 * @param {number} coinChange — positive or negative
 * @returns {{ coins: number }}
 */
function recordGame(uid, result, coinChange) {
    const db = loadDB();
    const id = String(uid);
    if (!db.players[id]) return { coins: 0 };
    const p = db.players[id];
    p.gamesPlayed = (p.gamesPlayed || 0) + 1;
    if      (result === 'win')  p.wins   = (p.wins   || 0) + 1;
    else if (result === 'loss') p.losses = (p.losses || 0) + 1;
    else if (result === 'draw') p.draws  = (p.draws  || 0) + 1;
    p.coins = Math.max(0, (p.coins || 0) + coinChange);
    saveDB(db);
    return { coins: p.coins };
}

/** Legacy helpers kept for compatibility */
function addCoins(uid, amount) {
    const db = loadDB();
    const id = String(uid);
    if (!db.players[id]) return 0;
    db.players[id].coins = Math.max(0, (db.players[id].coins || 0) + amount);
    saveDB(db);
    return db.players[id].coins;
}

function recordResult(uid, result) {
    const db = loadDB();
    const id = String(uid);
    if (!db.players[id]) return;
    db.players[id].gamesPlayed = (db.players[id].gamesPlayed || 0) + 1;
    if      (result === 'win')  db.players[id].wins   = (db.players[id].wins   || 0) + 1;
    else if (result === 'loss') db.players[id].losses = (db.players[id].losses || 0) + 1;
    else if (result === 'draw') db.players[id].draws  = (db.players[id].draws  || 0) + 1;
    saveDB(db);
}

function getLeaderboard(limit = 10) {
    const db = loadDB();
    return Object.entries(db.players)
        .filter(([, p]) => p.registered)
        .map(([uid, p]) => ({ uid, ...p }))
        .sort((a, b) => (b.coins || 0) - (a.coins || 0))
        .slice(0, limit);
}

function getAllPlayers() { return loadDB().players; }

function getTotalPlayers() {
    return Object.values(loadDB().players).filter(p => p.registered).length;
}

module.exports = {
    loadDB, saveDB, getPlayer, isRegistered, registerPlayer,
    recordGame, addCoins, recordResult,
    getLeaderboard, getAllPlayers, getTotalPlayers
};
