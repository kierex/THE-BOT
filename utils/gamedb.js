/**
 * gamedb.js — Persistent game database utility
 * Saves player data to utils/data/gamedb.json
 * Survives server restarts and resets
 * TEAM STARTCOPE BETA
 */
const fs   = require('fs-extra');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'utils/data/gamedb.json');

function loadDB() {
    if (!fs.existsSync(DATA_PATH)) {
        fs.ensureDirSync(path.dirname(DATA_PATH));
        const init = { players: {}, lastUpdated: Date.now() };
        fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2));
        return init;
    }
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); }
    catch(e) { return { players: {}, lastUpdated: Date.now() }; }
}

function saveDB(db) {
    db.lastUpdated = Date.now();
    fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
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

function updatePlayer(uid, changes) {
    const db = loadDB();
    const id = String(uid);
    if (!db.players[id]) return;
    Object.assign(db.players[id], changes);
    saveDB(db);
}

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

function getAllPlayers() {
    return loadDB().players;
}

function getTotalPlayers() {
    return Object.values(loadDB().players).filter(p => p.registered).length;
}

module.exports = {
    loadDB, saveDB, getPlayer, isRegistered, registerPlayer,
    updatePlayer, addCoins, recordResult, getLeaderboard,
    getAllPlayers, getTotalPlayers
};
