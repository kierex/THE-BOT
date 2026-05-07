/**
 * apitest.js — Test bot API connection and status
 * Checks if bot is alive, connected, and responsive
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

const BOT_START = Date.now();

module.exports.config = {
    name:            'apitest',
    version:         '1.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Test bot API connection and check bot status',
    commandCategory: 'Admin',
    usages:          'apitest',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;

    const pingStart = Date.now();
    let botID, botName;
    try {
        botID   = api.getCurrentUserID();
        botName = global.config.BOTNAME || 'Mirai Bot';
    } catch(e) {
        botID = 'N/A';
        botName = 'N/A';
    }
    const pingMs = Date.now() - pingStart;

    const upMs      = process.uptime() * 1000;
    const upSec     = Math.floor(upMs / 1000) % 60;
    const upMin     = Math.floor(upMs / 60000) % 60;
    const upHr      = Math.floor(upMs / 3600000);
    const uptimeStr = `${upHr}h ${upMin}m ${upSec}s`;

    const mem     = process.memoryUsage();
    const memMB   = (mem.rss / 1024 / 1024).toFixed(1);
    const heapMB  = (mem.heapUsed / 1024 / 1024).toFixed(1);

    const cmdCount = global.client?.commands?.size || 0;
    const evtCount = global.client?.eventRegistered?.length || 0;

    const pingStatus = pingMs < 300 ? '🟢 Fast' : pingMs < 800 ? '🟡 OK' : '🔴 Slow';
    const memStatus  = parseFloat(memMB) < 200 ? '🟢 Good' : parseFloat(memMB) < 400 ? '🟡 Normal' : '🔴 High';

    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  🤖 ${bold('API STATUS CHECK')}       ║\n` +
        `║  ⚡ ${bold('TEAM STARTCOPE BETA')}  ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `✅ ${bold('API: ONLINE & WORKING')}\n\n` +
        `${'─'.repeat(32)}\n` +
        `📡 ${bold('Connection')}\n` +
        `   ⚡ Ping: ${pingMs}ms — ${pingStatus}\n` +
        `   🤖 Bot ID: ${botID}\n` +
        `   📛 Bot Name: ${botName}\n\n` +
        `⏱️ ${bold('Runtime')}\n` +
        `   🕐 Uptime: ${uptimeStr}\n` +
        `   🌐 Platform: ${process.platform} | Node ${process.version}\n\n` +
        `💾 ${bold('Memory')}\n` +
        `   📊 RSS: ${memMB} MB — ${memStatus}\n` +
        `   🧠 Heap: ${heapMB} MB\n\n` +
        `🗂️ ${bold('Modules Loaded')}\n` +
        `   📦 Commands: ${cmdCount}\n` +
        `   ⚡ Event Handlers: ${evtCount}\n\n` +
        `${'─'.repeat(32)}\n` +
        `✅ ${bold('All systems operational!')}`,
        threadID, messageID
    );
};
