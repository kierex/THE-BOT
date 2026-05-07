/**
 * join.js — Welcome new members with AI canva image + message
 * Bot join message: "nandudurog ng tanga is now joining, kabahan na kayo"
 * TEAM STARTCOPE BETA
 */
const bold   = require('../../utils/bold');
const fs     = require('fs-extra');
const path   = require('path');
const axios  = require('axios');

const TEMP_DIR = path.join(process.cwd(), 'utils/data/welcome_temp');
fs.ensureDirSync(TEMP_DIR);

module.exports.config = {
    name:        'joinNoti',
    eventType:   ['log:subscribe'],
    version:     '3.0.0',
    credits:     'TEAM STARTCOPE BETA',
    description: 'Welcome members with AI canva image. Bot join has custom Tagalog message.',
};

// ── Generate welcome canva image via Pollinations ─────────────────────────────
async function generateWelcomeImage(name, threadName) {
    try {
        const safeName   = name.replace(/[^\x00-\x7F]/g, '').trim().slice(0, 20) || 'New Member';
        const safeThread = threadName.replace(/[^\x00-\x7F]/g, '').trim().slice(0, 25) || 'the group';
        const seed       = Math.floor(Math.random() * 999999);
        const prompt     = encodeURIComponent(
            `professional welcome banner for Facebook group, ` +
            `bold text "WELCOME" in large glowing gold letters at center, ` +
            `name "${safeName}" in large white bold font below, ` +
            `dark navy blue or deep purple gradient background, ` +
            `colorful confetti and sparkles, neon accent lines, ` +
            `bottom banner: "TEAM STARTCOPE BETA", ` +
            `ultra HD 4K, sharp text, clean professional layout, no blur`
        );
        const url = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=540&nologo=true&seed=${seed}&model=flux`;
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        if (!res.data || res.data.byteLength < 1000) throw new Error('Invalid image');
        const fp = path.join(TEMP_DIR, `welcome_${Date.now()}.jpg`);
        fs.writeFileSync(fp, Buffer.from(res.data));
        return fp;
    } catch(e) {
        return null;
    }
}

function cleanup(fp) {
    setTimeout(() => { try { fs.removeSync(fp); } catch {} }, 300000);
}

module.exports.run = async function ({ api, event, Users }) {
    const { threadID } = event;

    // ── Bot itself joined ─────────────────────────────────────────────────────
    if (event.logMessageData.addedParticipants.some(p => p.userFbId == api.getCurrentUserID())) {
        try {
            api.changeNickname(
                `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || 'Mirai Bot'}`,
                threadID,
                api.getCurrentUserID()
            );
        } catch {}
        return api.sendMessage(
            `🔥⚡ ${bold('NANDUDUROG NG TANGA IS NOW JOINING!')} ⚡🔥\n\n` +
            `😤 ${bold('KABAHAN NA KAYO!')} Nandito na ang bot!\n\n` +
            `🤖 ${bold(global.config.BOTNAME || 'Mirai Bot')} v${global.config.version || '5.0'}\n` +
            `⌨️ Prefix: ${bold(global.config.PREFIX)}\n\n` +
            `📖 I-type ang ${global.config.PREFIX}help para makita lahat ng commands!\n` +
            `🎮 ${global.config.PREFIX}register — sumali sa games at manalo ng coins!\n\n` +
            `💀 ${bold('Handa na ba kayo?!')} 😤🔥\n\n` +
            `⚡ — ${bold('TEAM STARTCOPE BETA')} — ⚡`,
            threadID
        );
    }

    // ── New member(s) joined ──────────────────────────────────────────────────
    try {
        const { threadName, participantIDs } = await api.getThreadInfo(threadID);
        const mentions  = [];
        const nameArray = [];
        const memCounts = [];
        let i = 0;

        for (const p of event.logMessageData.addedParticipants) {
            nameArray.push(p.fullName);
            mentions.push({ tag: p.fullName, id: p.userFbId });
            memCounts.push(participantIDs.length - i++);
            if (!global.data.allUserID.includes(String(p.userFbId))) {
                try { await Users.createData(p.userFbId, { name: p.fullName, data: {} }); } catch {}
                global.data.allUserID.push(String(p.userFbId));
            }
        }
        memCounts.sort((a, b) => a - b);

        const memberStr = memCounts.length === 1
            ? `Member #${memCounts[0]}`
            : `Members #${memCounts.join(', #')}`;

        const welcomeMsg =
            `╔══════════════════════════════╗\n` +
            `║  👋 ${bold('WELCOME!')}               ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `🎉 ${bold(nameArray.join(', '))}\n` +
            `📌 ${memberStr} sa ${bold(threadName || 'group')}\n\n` +
            `📖 I-type ang ${global.config.PREFIX}help para sa commands!\n` +
            `🎮 ${global.config.PREFIX}register — sumali sa games (free 100 coins!)\n\n` +
            `⚡ — ${bold('TEAM STARTCOPE BETA')} — ⚡`;

        // Try to generate welcome image (non-blocking)
        const firstName = nameArray[0] || 'New Member';
        generateWelcomeImage(firstName, threadName || 'the group').then(fp => {
            if (fp) {
                api.sendMessage({
                    body: welcomeMsg,
                    attachment: fs.createReadStream(fp),
                    mentions
                }, threadID, () => cleanup(fp));
            } else {
                api.sendMessage({ body: welcomeMsg, mentions }, threadID);
            }
        }).catch(() => {
            api.sendMessage({ body: welcomeMsg, mentions }, threadID);
        });

    } catch(e) {
        // Fallback — simple welcome
        try {
            const names = event.logMessageData.addedParticipants.map(p => p.fullName).join(', ');
            api.sendMessage(
                `👋 ${bold('Welcome!')} ${names}!\n\n` +
                `📖 I-type ang ${global.config.PREFIX}help para sa mga commands!\n` +
                `🎮 ${global.config.PREFIX}register — libre 100 coins!`,
                threadID
            );
        } catch {}
    }
};
