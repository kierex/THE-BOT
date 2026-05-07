/**
 * cleanall.js — Remove all non-admin members from the group
 * Bot must be admin. Use with extreme caution!
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

const pendingConfirm = new Map();

module.exports.config = {
    name:            'cleanall',
    version:         '1.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Tanggalin lahat ng members sa group (bot must be admin)',
    commandCategory: 'Admin',
    usages:          'cleanall — mag-confirm bago mag-execute',
    cooldowns:       10,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    // Confirm step
    const key = `${threadID}_${senderID}`;
    if (args[0]?.toLowerCase() !== 'confirm') {
        pendingConfirm.set(key, Date.now());
        setTimeout(() => pendingConfirm.delete(key), 30000);
        return api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  ⚠️ ${bold('CLEANALL WARNING!')}      ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `🚨 ${bold('PANSIN: Tatanggalin ng command na ito')}\n` +
            `ang LAHAT ng members sa group na ito!\n\n` +
            `❗ ${bold('Conditions:')}\n` +
            `• Bot must be group admin\n` +
            `• Ang mga bot admin ay hindi matatanggal\n` +
            `• Hindi ito mababawi pagkatapos!\n\n` +
            `🤔 ${bold('Sigurado ka ba?')}\n\n` +
            `✅ I-type: ${global.config.PREFIX}cleanall confirm\n` +
            `❌ Huwag i-type para i-cancel (30 seconds)\n\n` +
            `⏰ Mag-e-expire ang confirmation sa 30 segundo.`,
            threadID, messageID
        );
    }

    if (!pendingConfirm.has(key)) {
        return api.sendMessage(
            `⏰ ${bold('Expired na ang confirmation!')}\n` +
            `💡 I-type ulit ang ${global.config.PREFIX}cleanall para mag-umpisa.`,
            threadID, messageID
        );
    }
    pendingConfirm.delete(key);

    const botUID = String(api.getCurrentUserID());
    const adminUIDs = (global.config.ADMINBOT || []).map(String);

    let threadInfo;
    try {
        threadInfo = await api.getThreadInfo(threadID);
    } catch(e) {
        return api.sendMessage(
            `❌ ${bold('Hindi makuha ang thread info!')}\n🔧 ${e.message}`,
            threadID, messageID
        );
    }

    const members   = threadInfo.participantIDs || [];
    const toRemove  = members.filter(uid => {
        const s = String(uid);
        return s !== botUID && !adminUIDs.includes(s) && s !== String(senderID);
    });

    if (toRemove.length === 0) {
        return api.sendMessage(
            `😅 ${bold('Walang pwedeng i-remove!')}\n\n` +
            `💡 Lahat ng members ay admin o ikaw mismo.`,
            threadID, messageID
        );
    }

    api.sendMessage(
        `🧹 ${bold('Starting clean...')}\n` +
        `📊 Removing ${toRemove.length} member(s)...\n` +
        `⏳ Please wait...`,
        threadID, messageID
    );

    let removed = 0, failed = 0;
    for (const uid of toRemove) {
        try {
            await new Promise((res, rej) => {
                api.removeUserFromGroup(uid, threadID, (err) => {
                    if (err) rej(err); else res();
                });
            });
            removed++;
            await new Promise(r => setTimeout(r, 800)); // delay between kicks
        } catch(e) {
            failed++;
        }
    }

    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  ✅ ${bold('CLEAN COMPLETE!')}        ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🧹 ${bold('Removed:')} ${removed} member(s)\n` +
        `❌ ${bold('Failed:')} ${failed}\n` +
        `👥 ${bold('Natira:')} ${members.length - removed} member(s)\n\n` +
        `💡 Group is now clean!`,
        threadID
    );
};
