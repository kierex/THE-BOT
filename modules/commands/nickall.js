/**
 * nickall.js — Palitan lahat ng nickname ng grupo
 * Default: "dog" — pwede ring i-customize
 * Pwedeng mag-target ng specific na UID o @mention
 * TEAM STARTCOPE BETA
 */

const bold = require('../../utils/bold');

module.exports.config = {
    name: 'nickall',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Palitan lahat ng nickname ng mga miyembro — default ay "dog", pwede ring mag-customize',
    commandCategory: 'Group',
    usages: 'nickall [nickname] | nickall reset | nickall @mention [nickname]',
    cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions } = event;
    const PREFIX = global.config.PREFIX;

    // ── HELP ─────────────────────────────────────────────────────────────────
    if (!args[0]) {
        return api.sendMessage(
            `╔══════════════════════╗\n` +
            `║  🐶 ${bold('NICKALL COMMAND')}   ║\n` +
            `╚══════════════════════╝\n\n` +
            `📋 ${bold('Mga Commands:')}\n` +
            `${'─'.repeat(30)}\n` +
            `• ${PREFIX}nickall — lahat ay "dog" (default)\n` +
            `• ${PREFIX}nickall [nickname] — custom nickname para sa lahat\n` +
            `• ${PREFIX}nickall @mention [nickname] — isa lang ang palitan\n` +
            `• ${PREFIX}nickall uid [userID] [nickname] — target ng UID\n` +
            `• ${PREFIX}nickall reset — ibalik lahat sa original na pangalan\n\n` +
            `📌 ${bold('Mga Halimbawa:')}\n` +
            `${PREFIX}nickall — lahat ay "dog"\n` +
            `${PREFIX}nickall gago — lahat ay "gago"\n` +
            `${PREFIX}nickall @Juan gago ka — si Juan lang ang palitan\n` +
            `${PREFIX}nickall uid 100012345 tanga — palitan ng UID\n\n` +
            `⚠️ Kailangan ng bot admin permission para palitan ang nicknames.`,
            threadID, messageID
        );
    }

    // ── RESET — ibalik sa original na pangalan ────────────────────────────────
    if (args[0].toLowerCase() === 'reset') {
        api.sendMessage(`⏳ ${bold('Ine-reset ang lahat ng nickname...')}`, threadID, messageID);
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const memberIDs = threadInfo.participantIDs;
            let success = 0, fail = 0;
            for (const uid of memberIDs) {
                try {
                    await new Promise((res, rej) => {
                        api.changeNickname('', threadID, uid, err => err ? rej(err) : res());
                    });
                    success++;
                    await new Promise(r => setTimeout(r, 300));
                } catch (e) { fail++; }
            }
            return api.sendMessage(
                `✅ ${bold('Nickname Reset Tapos Na!')}\n\n` +
                `👥 ${bold('Na-reset:')} ${success} miyembro\n` +
                (fail > 0 ? `❌ ${bold('Hindi na-reset:')} ${fail} miyembro\n` : '') +
                `\n💡 Lahat ay nakabalik na sa kanilang original na pangalan.`,
                threadID, messageID
            );
        } catch (e) {
            return api.sendMessage(`❌ ${bold('Error:')} ${e.message}`, threadID, messageID);
        }
    }

    // ── UID TARGET — palitan ang specific na UID ──────────────────────────────
    if (args[0].toLowerCase() === 'uid') {
        const targetUID = args[1];
        const nickname = args.slice(2).join(' ').trim() || 'dog';
        if (!targetUID || isNaN(targetUID)) {
            return api.sendMessage(`❎ ${bold('Mali ang UID!')} Ilagay ang tamang User ID.`, threadID, messageID);
        }
        try {
            await new Promise((res, rej) => {
                api.changeNickname(nickname, threadID, targetUID, err => err ? rej(err) : res());
            });
            return api.sendMessage(
                `✅ ${bold('Nickname Changed!')}\n\n` +
                `🆔 ${bold('UID:')} ${targetUID}\n` +
                `🏷️ ${bold('Bagong Nickname:')} "${nickname}"`,
                threadID, messageID
            );
        } catch (e) {
            return api.sendMessage(`❌ ${bold('Hindi ma-change ang nickname ng UID na iyon.')}\n🔧 ${e.message}`, threadID, messageID);
        }
    }

    // ── MENTION TARGET — palitan ang @mentioned na user ───────────────────────
    const mentionIDs = Object.keys(mentions || {});
    if (mentionIDs.length > 0) {
        const mentionedUID = mentionIDs[0];
        const nickname = args.slice(1).join(' ').replace(mentions[mentionedUID] || '', '').trim() || 'dog';
        try {
            await new Promise((res, rej) => {
                api.changeNickname(nickname, threadID, mentionedUID, err => err ? rej(err) : res());
            });
            return api.sendMessage(
                `✅ ${bold('Nickname Changed!')}\n\n` +
                `👤 ${bold('User:')} ${mentions[mentionedUID] || mentionedUID}\n` +
                `🏷️ ${bold('Bagong Nickname:')} "${nickname}"`,
                threadID, messageID
            );
        } catch (e) {
            return api.sendMessage(`❌ ${bold('Hindi ma-change ang nickname.')}\n🔧 ${e.message}`, threadID, messageID);
        }
    }

    // ── LAHAT — palitan lahat ng miyembro ─────────────────────────────────────
    const nickname = args.join(' ').trim() || 'dog';
    api.sendMessage(
        `⏳ ${bold('Pina-palitan ng nickname ang lahat ng miyembro...')}\n` +
        `🏷️ Bagong nickname: "${bold(nickname)}"`,
        threadID, messageID
    );

    try {
        const threadInfo = await api.getThreadInfo(threadID);
        const memberIDs = threadInfo.participantIDs.filter(id => id !== api.getCurrentUserID());
        let success = 0, fail = 0;
        for (const uid of memberIDs) {
            try {
                await new Promise((res, rej) => {
                    api.changeNickname(nickname, threadID, uid, err => err ? rej(err) : res());
                });
                success++;
                await new Promise(r => setTimeout(r, 400));
            } catch (e) { fail++; }
        }
        return api.sendMessage(
            `✅ ${bold('Nickall Tapos Na!')}\n\n` +
            `🏷️ ${bold('Nickname:')} "${nickname}"\n` +
            `👥 ${bold('Na-change:')} ${success} miyembro\n` +
            (fail > 0 ? `❌ ${bold('Hindi na-change:')} ${fail} miyembro\n` : '') +
            `\n🐶 ${nickname === 'dog' ? 'Arf arf! Lahat ay aso na ngayon! 🐕' : 'Done na!'}`,
            threadID, messageID
        );
    } catch (e) {
        return api.sendMessage(`❌ ${bold('Error:')} ${e.message}`, threadID, messageID);
    }
};
