/**
 * uptime.js — Bot uptime tracker
 * Nagpapakita kung gaano katagal naka-online ang bot
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

module.exports.config = {
    name:            'uptime',
    version:         '1.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Tingnan kung gaano katagal naka-online ang bot',
    commandCategory: 'General',
    usages:          'uptime',
    cooldowns:       5,
};

function formatUptime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const days     = Math.floor(totalSec / 86400);
    const hours    = Math.floor((totalSec % 86400) / 3600);
    const minutes  = Math.floor((totalSec % 3600) / 60);
    const seconds  = totalSec % 60;

    const parts = [];
    if (days    > 0) parts.push(`${days}d`);
    if (hours   > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    return parts.join(' ');
}

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID } = event;

    const uptimeMs = process.uptime() * 1000;
    const formatted = formatUptime(uptimeMs);

    const mem     = process.memoryUsage();
    const memMB   = (mem.rss / 1024 / 1024).toFixed(1);

    const startDate = new Date(Date.now() - uptimeMs);
    const options   = { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' };
    const startStr  = startDate.toLocaleString('en-PH', options);

    const status =
        uptimeMs < 3600000  ? '🔵 Just started' :
        uptimeMs < 86400000 ? '🟢 Running well' :
                              '🏆 Long uptime!';

    return api.sendMessage(
        `╔══════════════════════════╗\n` +
        `║  ⏱️ ${bold('BOT UPTIME')}           ║\n` +
        `╚══════════════════════════╝\n\n` +
        `⏰ ${bold('Uptime:')} ${formatted}\n` +
        `${status}\n\n` +
        `📅 ${bold('Online since:')}\n` +
        `   ${startStr} (PH Time)\n\n` +
        `💾 ${bold('Memory:')} ${memMB} MB\n` +
        `🌐 ${bold('Node:')} ${process.version}\n` +
        `🤖 ${bold('Bot:')} ${global.config.BOTNAME || 'Mirai Bot'} v${global.config.version || '3.0'}`,
        threadID, messageID
    );
};
