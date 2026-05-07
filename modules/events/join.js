/**
 * join.js — Welcome new members with AI canva image
 * Bot join message: NANDUDUROG NG TANGA IS NOW JOINING, KABAHAN NA KAYO
 * TEAM STARTCOPE BETA
 */
const bold  = require('../../utils/bold');
const fs    = require('fs-extra');
const path  = require('path');
const axios = require('axios');

const TEMP_DIR = path.join(process.cwd(), 'utils', 'data', 'welcome_temp');
try { fs.ensureDirSync(TEMP_DIR); } catch(e) { /* non-fatal */ }

module.exports.config = {
    name:        'joinNoti',
    eventType:   ['log:subscribe'],
    version:     '3.1.0',
    credits:     'xie',
    description: 'Welcome members with AI canva image. Bot join has custom Tagalog message.',
};

// ── Generate welcome image via Pollinations ───────────────────────────────────
async function generateWelcomeImage(name) {
    try {
        const safeName = String(name || 'New Member')
            .replace(/[^\x20-\x7E]/g, '')   // ASCII only for URL safety
            .trim()
            .slice(0, 20) || 'New Member';
        const seed   = Math.floor(Math.random() * 999999);
        const prompt = encodeURIComponent(
            `professional Facebook group welcome banner, bold glowing gold text "WELCOME" at center, ` +
            `white bold text "${safeName}" below, dark navy blue deep purple gradient background, ` +
            `colorful confetti sparkles neon accent lines, bottom text "TEAM STARTCOPE BETA", ` +
            `ultra HD 4K sharp text clean professional layout`
        );
        const url = `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=540&nologo=true&seed=${seed}&model=flux`;
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        if (!res.data || res.data.byteLength < 1000) throw new Error('Invalid image response');
        const fp = path.join(TEMP_DIR, `welcome_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
        fs.writeFileSync(fp, Buffer.from(res.data));
        return fp;
    } catch(e) {
        return null;
    }
}

function cleanupLater(fp) {
    setTimeout(() => { try { fs.removeSync(fp); } catch {} }, 600000); // 10 min
}

module.exports.run = async function ({ api, event, Users }) {
    try {
        const { threadID } = event;

        // ── Guard: need addedParticipants ─────────────────────────────────────
        const added = event.logMessageData?.addedParticipants;
        if (!added || !added.length) return;

        const botUID = String(api.getCurrentUserID());

        // ── Bot itself joined ─────────────────────────────────────────────────
        if (added.some(p => String(p.userFbId) === botUID)) {
            try {
                api.changeNickname(
                    `[ ${global.config.PREFIX} ] • ${global.config.BOTNAME || 'Mirai Bot'}`,
                    threadID, botUID, () => {}
                );
            } catch(e) { /* non-fatal */ }

            return api.sendMessage(
                `🔥⚡ ${bold('NANDUDUROG NG TANGA IS NOW JOINING!')} ⚡🔥\n\n` +
                `😤 ${bold('KABAHAN NA KAYO!')} Nandito na ang bot!\n\n` +
                `🤖 ${bold(global.config.BOTNAME || 'Mirai Bot')} v${global.config.version || '5.0'}\n` +
                `⌨️ Prefix: ${bold(global.config.PREFIX)}\n\n` +
                `📖 I-type ang ${global.config.PREFIX}help para sa commands!\n` +
                `🎮 ${global.config.PREFIX}register — sumali sa games (libre 100 coins!)\n\n` +
                `💀 ${bold('Handa na ba kayo?!')} 😤🔥\n\n` +
                `⚡ — ${bold('TEAM STARTCOPE BETA')} — ⚡`,
                threadID
            );
        }

        // ── New member(s) joined ──────────────────────────────────────────────
        const nameArray = added.map(p => p.fullName || 'New Member');
        const firstName = nameArray[0] || 'New Member';

        // Register in DB if needed
        for (const p of added) {
            try {
                const uid = String(p.userFbId);
                if (!global.data.allUserID.includes(uid)) {
                    await Users.createData(uid, { name: p.fullName || 'New Member', data: {} });
                    global.data.allUserID.push(uid);
                }
            } catch(e) { /* non-fatal */ }
        }

        // Build welcome text
        let threadName = 'the group';
        try {
            const info = await api.getThreadInfo(threadID);
            if (info?.threadName) threadName = info.threadName;
        } catch(e) { /* non-fatal */ }

        const welcomeBody =
            `╔══════════════════════════════╗\n` +
            `║  👋 ${bold('WELCOME!')}               ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `🎉 ${bold(nameArray.join(', '))}\n` +
            `📌 Bagong miyembro ng ${bold(threadName)}!\n\n` +
            `📖 I-type ang ${global.config.PREFIX}help para sa commands!\n` +
            `🎮 ${global.config.PREFIX}register — libre 100 coins!\n` +
            `🏅 ${global.config.PREFIX}rich — game leaderboard\n\n` +
            `⚡ — ${bold('MGA UGOKK')} — ⚡`;

        // Generate AI welcome image (non-blocking)
        generateWelcomeImage(firstName).then(fp => {
            if (fp) {
                api.sendMessage(
                    { body: welcomeBody, attachment: fs.createReadStream(fp) },
                    threadID,
                    () => cleanupLater(fp)
                );
            } else {
                api.sendMessage(welcomeBody, threadID);
            }
        }).catch(() => {
            api.sendMessage(welcomeBody, threadID);
        });

    } catch(e) {
        // Last-resort fallback — never let the event handler crash
        try {
            const added = event.logMessageData?.addedParticipants || [];
            const names = added.map(p => p.fullName || 'someone').join(', ');
            if (names) {
                api.sendMessage(
                    `👋 ${bold('Welcome!')} ${names}!\n` +
                    `📖 ${global.config.PREFIX}help | 🎮 ${global.config.PREFIX}register`,
                    event.threadID
                );
            }
        } catch(e2) { /* absolute last resort silent */ }
    }
};
