/**
 * help.js — Command list viewer (plain text, no images)
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

module.exports.config = {
    name:            'help',
    version:         '2.1.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'View all commands and detailed info per command',
    commandCategory: 'General',
    usages:          'help | help [command] | help all',
    cooldowns:       3,
};

function permText(p) {
    return p === 0 ? '👤 Member' : p === 1 ? '⭐ Group Admin' : p === 2 ? '🌟 Bot Admin' : '👑 Owner';
}

function getCategories(cmds) {
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
    const cmds = global.client.commands;

    // Fix: use String() not parseInt() — FB IDs lose precision with parseInt
    const threadSetting = global.data.threadData.get(String(event.threadID)) || {};
    const P = threadSetting.PREFIX || global.config.PREFIX;

    const type = (args[0] || '').toLowerCase().trim();

    // ── !help all ────────────────────────────────────────────────────────────
    if (type === 'all') {
        let msg = `╔══════════════════════════╗\n║  📚 ${bold('ALL COMMANDS')}        ║\n╚══════════════════════════╝\n\n`;
        let i = 0;
        for (const cmd of cmds.values()) {
            msg += `${++i}. ${bold(P + cmd.config.name)} — ${cmd.config.description || ''}\n`;
        }
        msg += `\n📊 ${bold('Total:')} ${cmds.size} commands\n💡 ${P}help [command] for details`;
        return api.sendMessage(msg, threadID, messageID);
    }

    // ── !help [command name] ─────────────────────────────────────────────────
    if (type && type !== 'all') {
        const lookup = type.startsWith(P) ? type.slice(P.length) : type;
        const cmd    = cmds.get(lookup);
        if (!cmd) {
            let best = ''; let bestScore = 0;
            for (const k of cmds.keys()) {
                let s = 0;
                for (const c of lookup) if (k.includes(c)) s++;
                if (s > bestScore) { bestScore = s; best = k; }
            }
            return api.sendMessage(
                `❌ ${bold('Command not found:')} "${lookup}"\n` +
                (best ? `💡 ${bold('Did you mean:')} ${P}${best}?` : `💡 ${P}help — all commands`),
                threadID, messageID
            );
        }
        const c = cmd.config;
        return api.sendMessage(
            `╔══════════════════════════╗\n║  📖 ${bold('COMMAND INFO')}       ║\n╚══════════════════════════╝\n\n` +
            `📌 ${bold('Name:')} ${c.name}\n` +
            `👤 ${bold('Author:')} ${c.credits || 'TEAM STARTCOPE BETA'}\n` +
            `📦 ${bold('Version:')} ${c.version || '1.0.0'}\n` +
            `🔐 ${bold('Permission:')} ${permText(c.hasPermssion ?? 0)}\n` +
            `📝 ${bold('Description:')} ${c.description || 'N/A'}\n` +
            `🏷️ ${bold('Category:')} ${c.commandCategory || 'General'}\n` +
            `📎 ${bold('Usage:')} ${P}${c.usages || c.name}\n` +
            `⏳ ${bold('Cooldown:')} ${c.cooldowns || 3}s`,
            threadID, messageID
        );
    }

    // ── !help (main menu) ────────────────────────────────────────────────────
    const categories = getCategories(cmds);
    const catIcons   = { Admin:'🛡️', Games:'🎮', General:'📋', AI:'🤖', Group:'👥', Other:'📦' };

    let msg =
        `╔══════════════════════════════╗\n` +
        `║  🤖 ${bold('MIRAI-V5 — COMMANDS')}   ║\n` +
        `║  ⚡ ${bold('TEAM STARTCOPE BETA')}  ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🔑 ${bold('Prefix:')} ${P}   📊 ${bold('Total:')} ${cmds.size}\n\n`;

    for (const [cat, names] of categories) {
        const icon = catIcons[cat] || '📦';
        msg += `${'─'.repeat(30)}\n${icon} ${bold(cat)} (${names.length})\n`;
        msg += names.map(n => `  • ${P}${n}`).join('\n') + '\n';
    }

    msg +=
        `${'─'.repeat(30)}\n\n` +
        `💡 ${P}help [command] → details\n` +
        `💡 ${P}help all → full list\n` +
        `🎮 ${P}register → sumali sa games (free 100 coins!)\n\n` +
        `🤖 ${bold(global.config.BOTNAME || 'Mirai-V5')} v${global.config.version || '5.0'}`;

    return api.sendMessage(msg, threadID, messageID);
};
