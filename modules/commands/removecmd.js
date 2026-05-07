/**
 * removecmd.js — Dynamic command remover
 * Mag-tanggal ng command file at i-unload mula sa memory
 * TEAM STARTCOPE BETA
 */
const fs   = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const CMDS_DIR     = path.join(process.cwd(), 'modules/commands');
const PROTECTED    = new Set(['help', 'cmd', 'addcmd', 'removecmd', 'apitest', 'uptime']);

module.exports.config = {
    name:            'removecmd',
    version:         '1.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Mag-remove ng command file at i-unload sa memory',
    commandCategory: 'Admin',
    usages:          'removecmd [command name] | removecmd list',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const P   = global.config.PREFIX;
    const sub = (args[0] || '').toLowerCase();

    // LIST all removable commands
    if (!sub || sub === 'list') {
        const files  = fs.readdirSync(CMDS_DIR).filter(f => f.endsWith('.js'));
        const cmds   = files.map(f => f.replace(/\.js$/, ''));
        const locked = cmds.filter(c => PROTECTED.has(c));
        const free   = cmds.filter(c => !PROTECTED.has(c));

        let msg =
            `╔══════════════════════════════╗\n` +
            `║  🗑️ ${bold('REMOVECMD — LIST')}       ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `📊 ${bold('Total commands:')} ${cmds.length}\n\n`;

        if (free.length > 0) {
            msg += `✅ ${bold('Pwedeng i-remove:')}\n`;
            free.forEach((c, i) => { msg += `${i + 1}. ${P}${c}\n`; });
        } else {
            msg += `😔 Wala pang commands na pwedeng i-remove.\n`;
        }

        if (locked.length > 0) {
            msg += `\n🔒 ${bold('Protected (hindi matatanggal):')}\n`;
            locked.forEach(c => { msg += `• ${P}${c}\n`; });
        }

        msg += `\n💡 ${P}removecmd [command name] para mag-tanggal.`;
        return api.sendMessage(msg, threadID, messageID);
    }

    const name = sub.replace(/^!/, '');

    if (PROTECTED.has(name)) {
        return api.sendMessage(
            `🔒 ${bold('Protected Command!')}\n\n` +
            `❌ Hindi pwedeng i-remove ang "${name}" — ito ay isang core command.\n\n` +
            `💡 ${P}removecmd list para makita ang removable commands.`,
            threadID, messageID
        );
    }

    const filePath = path.join(CMDS_DIR, `${name}.js`);
    if (!fs.existsSync(filePath)) {
        return api.sendMessage(
            `❌ ${bold('Command not found:')} "${name}"\n\n` +
            `💡 ${P}removecmd list para makita lahat ng commands.`,
            threadID, messageID
        );
    }

    // Unload from memory
    try {
        global.client.commands.delete(name);
        global.client.eventRegistered = global.client.eventRegistered.filter(e => e !== name);
        try { delete require.cache[require.resolve(filePath)]; } catch {}
    } catch(e) { /* silent — file delete still proceeds */ }

    // Delete file
    try {
        fs.removeSync(filePath);
    } catch(e) {
        return api.sendMessage(
            `❌ ${bold('File deletion failed!')}\n🔧 ${e.message}`,
            threadID, messageID
        );
    }

    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  ✅ ${bold('COMMAND REMOVED!')}       ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🗑️ ${bold('Deleted:')} ${name}.js\n` +
        `🧠 ${bold('Unloaded from memory')}\n\n` +
        `💡 ${P}removecmd list para makita ang natitira.`,
        threadID, messageID
    );
};
