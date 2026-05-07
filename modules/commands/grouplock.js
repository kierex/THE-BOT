/**
 * grouplock.js — Nagla-lock ng pangalan ng group chat
 * Kapag nag-change ng group name habang naka-lock, awtomatikong babalik sa dati
 * TEAM STARTCOPE BETA
 */

const fs = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const DATA_PATH = path.join(process.cwd(), 'utils/data/grouplock.json');

function loadData() {
    if (!fs.existsSync(DATA_PATH)) {
        fs.ensureDirSync(path.dirname(DATA_PATH));
        fs.writeFileSync(DATA_PATH, JSON.stringify({}), 'utf8');
    }
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch (e) { return {}; }
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

module.exports.config = {
    name: 'grouplock',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'I-lock ang pangalan ng group chat — kapag binago, awtomatikong babalik sa dati',
    commandCategory: 'Group',
    usages: 'grouplock [on/off/status] [custom name]',
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const sub = (args[0] || '').toLowerCase();
    const data = loadData();

    if (sub === 'status') {
        const entry = data[threadID];
        return api.sendMessage(
            `╔══════════════════════╗\n` +
            `║  🔒 ${bold('GROUP LOCK STATUS')}  ║\n` +
            `╚══════════════════════╝\n\n` +
            `📌 ${bold('Status:')} ${entry ? '🔒 ON ✅' : '🔓 OFF'}\n` +
            (entry ? `📝 ${bold('Locked Name:')} ${entry.name}\n` : '') +
            `\n💡 Gamitin ang ${global.config.PREFIX}grouplock on/off para mag-toggle`,
            threadID, messageID
        );
    }

    if (sub === 'off') {
        if (!data[threadID]) return api.sendMessage(`❎ ${bold('Grouplock ay hindi pa naka-on sa group na ito.')}`, threadID, messageID);
        delete data[threadID];
        saveData(data);
        return api.sendMessage(
            `🔓 ${bold('GROUPLOCK: OFF')}\n\n` +
            `✅ Pwede na ngayong baguhin ang pangalan ng group.\n` +
            `💡 I-type ang ${global.config.PREFIX}grouplock on para i-lock ulit.`,
            threadID, messageID
        );
    }

    if (sub === 'on' || sub === '') {
        let lockedName = args.slice(1).join(' ').trim();
        if (!lockedName) {
            try {
                const info = await api.getThreadInfo(threadID);
                lockedName = info.threadName || 'Group Chat';
            } catch (e) {
                lockedName = 'Group Chat';
            }
        }
        data[threadID] = { name: lockedName, lockedAt: Date.now() };
        saveData(data);
        return api.sendMessage(
            `🔒 ${bold('GROUPLOCK: ON ✅')}\n\n` +
            `📌 ${bold('Naka-lock na ang pangalan ng group!')}\n` +
            `📝 ${bold('Locked Name:')} ${lockedName}\n\n` +
            `⚠️ Kapag sinubukan ng sinuman na baguhin ang pangalan, awtomatikong babalik ito sa:\n` +
            `"${lockedName}"\n\n` +
            `💡 I-type ang ${global.config.PREFIX}grouplock off para i-unlock.`,
            threadID, messageID
        );
    }

    return api.sendMessage(
        `╔══════════════════════╗\n` +
        `║  🔒 ${bold('GROUP LOCK')}          ║\n` +
        `╚══════════════════════╝\n\n` +
        `📋 ${bold('Mga Commands:')}\n` +
        `• ${global.config.PREFIX}grouplock on — i-lock ang current na pangalan\n` +
        `• ${global.config.PREFIX}grouplock on [pangalan] — i-lock sa custom na pangalan\n` +
        `• ${global.config.PREFIX}grouplock off — i-unlock\n` +
        `• ${global.config.PREFIX}grouplock status — tingnan ang status\n\n` +
        `💡 ${bold('Tip:')} Dapat admin ka para magamit ito.`,
        threadID, messageID
    );
};

