/**
 * help.js — Command list viewer (plain text, no images)
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

module.exports.config = {
    name:            'help',
    version:         '2.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'View command list and detailed info per command',
    commandCategory: 'General',
    usages:          '[command name] | all',
    cooldowns:       3,
};

function getPermText(p) {
    return p === 0 ? '👤 Member' : p === 1 ? '⭐ Group Admin' : p === 2 ? '🌟 Bot Admin' : '👑 Owner';
}

function buildCategories(cmds) {
    const map = new Map();
    for (const cmd of cmds.values()) {
        const cat = cmd.config.commandCategory || 'Other';
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat).push(cmd.config.name);
    }
    return map;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const cmds   = global.client.commands;
    const P      = (global.data.threadData.get(parseInt(event.threadID)) || {}).PREFIX
                   || global.config.PREFIX;
    const type   = (args[0] || '').toLowerCase();

    if (type === 'all') {
        let msg = `╔══════════════════════════╗\n║  📚 ${bold('ALL COMMANDS')}         ║\n╚══════════════════════════╝\n\n`;
        let i = 0;
        for (const cmd of cmds.values()) {
            msg += `${++i}. ${bold(P + cmd.config.name)} — ${cmd.config.description}\n`;
        }
        msg += `\n📊 ${bold('Total:')} ${cmds.size} commands\n💡 ${P}help [command] for details`;
        return api.sendMessage(msg, threadID, messageID);
    }

    if (type) {
        const cmd = cmds.get(type) || cmds.get(type.replace(/^!/, ''));
        if (!cmd) {
            let best = '';
            let bestScore = 0;
            for (const k of cmds.keys()) {
                let score = 0;
                for (const c of type) if (k.includes(c)) score++;
                if (score > bestScore) { bestScore = score; best = k; }
            }
            return api.sendMessage(
                `❌ ${bold('Command not found:')} "${type}"\n` +
                (best ? `💡 ${bold('Did you mean:')} "${best}"?` : `💡 ${P}help para makita lahat`),
                threadID, messageID
            );
        }
        const c = cmd.config;
        return api.sendMessage(
            `╔══════════════════════════╗\n` +
            `║  📖 ${bold('COMMAND INFO')}        ║\n` +
            `╚══════════════════════════╝\n\n` +
            `📌 ${bold('Name:')} ${c.name}\n` +
            `👤 ${bold('Author:')} ${c.credits || 'TEAM STARTCOPE BETA'}\n` +
            `📦 ${bold('Version:')} ${c.version || '1.0.0'}\n` +
            `🔐 ${bold('Permission:')} ${getPermText(c.hasPermssion)}\n` +
            `📝 ${bold('Description:')} ${c.description}\n` +
            `🏷️ ${bold('Category:')} ${c.commandCategory}\n` +
            `📎 ${bold('Usage:')} ${P}${c.usages || c.name}\n` +
            `⏳ ${bold('Cooldown:')} ${c.cooldowns || 3}s`,
            threadID, messageID
        );
    }

    const categories = buildCategories(cmds);
    let msg =
        `╔══════════════════════════════╗\n` +
        `║  🤖 ${bold('MIRAI-V5 BOT')} — ${bold('COMMANDS')}║\n` +
        `║  ⚡ ${bold('TEAM STARTCOPE BETA')}    ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🔑 ${bold('Prefix:')} ${P}\n` +
        `📊 ${bold('Total:')} ${cmds.size} commands\n\n`;

    const catIcons = {
        'Admin':   '🛡️',
        'Games':   '🎮',
        'General': '📋',
        'AI':      '🤖',
        'Group':   '👥',
        'Other':   '📦',
    };

    for (const [cat, names] of categories) {
        const icon = catIcons[cat] || '📦';
        msg += `${'─'.repeat(32)}\n`;
        msg += `${icon} ${bold(cat.toUpperCase())} (${names.length})\n`;
        msg += names.map(n => `  • ${P}${n}`).join('\n') + '\n';
    }

    msg +=
        `${'─'.repeat(32)}\n\n` +
        `💡 ${P}help [command] → details\n` +
        `💡 ${P}help all → full list\n\n` +
        `🤖 ${bold('Bot:')} ${global.config.BOTNAME || 'Mirai-V5'} v${global.config.version || '5.0'}`;

    return api.sendMessage(msg, threadID, messageID);
};
