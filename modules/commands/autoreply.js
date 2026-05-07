/**
 * autoreply.js — Auto-reply sa lahat ng mensahe ng members kapag ON
 * handleEvent fires on every message — keyword rules have priority,
 * then roast mode (100%) or default mode (65% chance).
 * Saved to utils/data/autoreply.json — survives restarts.
 * TEAM STARTCOPE BETA
 */
const fs   = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const DATA_DIR  = path.join(process.cwd(), 'utils', 'data');
const DATA_PATH = path.join(DATA_DIR, 'autoreply.json');

// ── Built-in roast phrases ────────────────────────────────────────────────────
const ROASTS = [
    "lol sybau gng","u talk too much lol","bro thought he cooked","u not scary ngl",
    "calm down lil bro","u funny for that","stay in yo lane","bro got no aim",
    "u really tried huh","don't start crying now","u all talk fr","bro think he famous",
    "u lost already","weak comeback ngl","u typing too fast lol","bro got no chill",
    "that was kinda sad","u got cooked bro","don't bark too loud","bro mad for nothing",
    "u doing too much","that ain't it chief","bro got folded","u built different bad",
    "stop yapping lol","u not him bro","bro think he slick","u got no motion",
    "stay mad lil bro","bro got packed up","not the flex u think","u goofy ngl",
    "bro got carried","u tryna fit in","calm yo self lol","bro got no wins",
    "u weird for that","bro got silence after","u thought u ate","that was embarrassing ngl",
    "bro got no comeback","u loud and wrong","bro really pressed","u doing side quests",
    "not bro again lol","u got humbled quick","bro fell off","don't cry now bro",
    "u acting tough online","bro lost the plot","u not cooking anything","bro got ratioed",
    "u tried your best maybe","bro got no aura","u sound confused ngl","bro stay losing",
    "u ain't winning this","bro got scared lowkey","stop acting hard lol","u got smoked easy",
    "bro need backup","u typing paragraphs now","bro got exposed quick","u thought that hit",
    "bro got no clue","u really proud of that","bro got denied","u too emotional lol",
    "bro got dropped","u not built for this","bro got quiet fast","u moving weird ngl",
    "bro need practice","u got no game","bro acting famous","u got folded instantly",
    "bro got no timing","u ain't slick bro","bro got caught lacking","u trying too hard",
    "bro need to log off","u got no chance","bro got roasted easy","u funny looking rn",
    "bro got skipped","u stay talking nonsense","bro got no energy","u really thought huh",
    "bro need a reboot","u got cooked instantly","bro got no style","u ain't intimidating nobody",
    "bro got ignored","u sound silly rn","bro got shutdown quick","u trying to be relevant",
    "bro lost again lol","u got no response now","bro need new lines","u acting brand new",
    "bro got embarrassed hard","u too loud online","bro got left behind","u not serious rn",
    "bro got no defense","u already lost bro","bro got frozen","u doing clown activities",
    "bro got muted mentally","u can't be real rn","bro got no balance","u sound mad lowkey",
    "bro got no support","u got handled easy","bro moving desperate","u ain't built like that",
    "bro got played","u keep missing lol","bro got no drip","u really confident huh",
    "bro got shut down","u sound goofy today","bro got no signal","u overthinking everything",
    "bro got deleted","u still talking lol","bro got no luck","u got folded twice",
    "bro got no reaction","u tripping again","bro got lost quick","u really made that up",
    "bro got zero points","u acting funny now","bro got turned around","u got no rhythm",
    "bro got left speechless","u trying to start something","bro got no sauce",
    "u ain't tough fr","bro got checked","u got no moves","bro got cooked daily",
    "u sound tired already","bro got no patience","u stay embarrassing yourself",
    "bro got no direction","u really pressed over that","bro got outplayed",
    "u got no standards","bro got clowned easy","u acting extra today",
    "bro got no awareness","u moving reckless online","bro got no momentum",
    "u got laughed at","bro got no answer","u trying too much","bro got folded badly",
    "u got no cool points","bro got no strategy","u already confused lol",
    "bro got exposed again","u got no focus","bro got embarrassed again",
    "u need better lines","bro got no confidence","u sound salty rn",
];

// ── Friendly default replies ──────────────────────────────────────────────────
const DEFAULTS = [
    "ano ba iyan 😏","o sige sige 😂","ay sus! 😅","hala ka naman 🤣","naks naman ah 😄",
    "okey lang yan bro 😎","ganyan talaga buhay 😆","char lang! 😂","lol ok 😂",
    "ay nako 🙄","grabe ka talaga 😂","wow ha 🤩","sige mo nga 😏","jusko 😂",
    "hahaha fr 😂","ikaw na 😅","sigue na 😎","talaga ba? 🤔","oo na oo na 😂",
    "aminin mo na 😏","ay nako ka 😂","lol ok sige 😆","oo naman 😊","ay wow 😮",
    "pakialam ko ba 😂","grabe naman 😂","haha ok 😄","sige bro 😎",
    "di ko gets 😂","bruh 💀","ok ok 😏","hala 👀","lol 😂","char 🤣","sige na nga 😅",
];

// ── File helpers ───────────────────────────────────────────────────────────────
function loadData() {
    try {
        fs.ensureDirSync(DATA_DIR);
        if (!fs.existsSync(DATA_PATH)) {
            const init = { enabled: {}, roastEnabled: {}, rules: {} };
            fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2));
            return init;
        }
        const d = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        if (!d.roastEnabled) d.roastEnabled = {};
        if (!d.rules)        d.rules        = {};
        if (!d.enabled)      d.enabled      = {};
        return d;
    } catch(e) {
        return { enabled: {}, roastEnabled: {}, rules: {} };
    }
}

function saveData(data) {
    try { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)); } catch(e) { /* silent */ }
}

function randRoast()   { return ROASTS[Math.floor(Math.random() * ROASTS.length)]; }
function randDefault() { return DEFAULTS[Math.floor(Math.random() * DEFAULTS.length)]; }
function norm(t)       { return String(t || '').toLowerCase().trim(); }

// ── Command config ────────────────────────────────────────────────────────────
module.exports.config = {
    name:            'autoreply',
    version:         '3.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Auto-reply sa lahat ng mensahe kapag ON — may keyword rules + roast mode',
    commandCategory: 'Group',
    usages:          'autoreply [on/off/roast on|off/add/remove/list/clear]',
    cooldowns:       3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const P    = global.config.PREFIX;
    const data = loadData();
    const sub  = (args[0] || '').toLowerCase();

    // Init thread data
    if (!data.rules[threadID])      data.rules[threadID]       = [];
    if (data.enabled[threadID]      === undefined) data.enabled[threadID]      = false;
    if (data.roastEnabled[threadID] === undefined) data.roastEnabled[threadID] = false;

    // ── ON ───────────────────────────────────────────────────────────────────
    if (sub === 'on') {
        data.enabled[threadID] = true;
        saveData(data);
        return api.sendMessage(
            `✅ ${bold('AUTO-REPLY: ON')}\n\n` +
            `🤖 Mag-rereply na ang bot sa mga mensahe!\n` +
            `💬 ${data.rules[threadID].length} custom rules\n` +
            `📚 ${DEFAULTS.length} friendly + ${ROASTS.length} roast lines built-in\n\n` +
            `🔥 ${P}autoreply roast on — para gamitin ang roast replies\n` +
            `❌ ${P}autoreply off — para i-stop`,
            threadID, messageID
        );
    }

    // ── OFF ──────────────────────────────────────────────────────────────────
    if (sub === 'off') {
        data.enabled[threadID]      = false;
        data.roastEnabled[threadID] = false;
        saveData(data);
        return api.sendMessage(
            `❌ ${bold('AUTO-REPLY: OFF')}\n💡 ${P}autoreply on para i-activate ulit.`,
            threadID, messageID
        );
    }

    // ── ROAST ON / OFF ───────────────────────────────────────────────────────
    if (sub === 'roast') {
        const r = (args[1] || '').toLowerCase();
        if (r === 'on') {
            data.enabled[threadID]      = true;
            data.roastEnabled[threadID] = true;
            saveData(data);
            return api.sendMessage(
                `🔥 ${bold('ROAST MODE: ON')}\n\n` +
                `😂 Bot mag-roro-roast sa bawat mensahe!\n` +
                `💬 ${ROASTS.length} roast lines ready\n` +
                `Sample: "${randRoast()}"\n\n` +
                `${P}autoreply roast off — para i-stop`,
                threadID, messageID
            );
        }
        if (r === 'off') {
            data.roastEnabled[threadID] = false;
            saveData(data);
            return api.sendMessage(
                `🔕 ${bold('ROAST MODE: OFF')}\n` +
                `(Auto-reply naka-on pa rin — gumagamit ng friendly replies)\n` +
                `💡 ${P}autoreply off — para i-off completely`,
                threadID, messageID
            );
        }
        return api.sendMessage(
            `🔥 ${bold('Roast Mode:')} ${data.roastEnabled[threadID] ? '✅ ON' : '❌ OFF'}\n` +
            `Sample: "${randRoast()}"\n` +
            `${P}autoreply roast on/off`,
            threadID, messageID
        );
    }

    // ── ADD keyword | reply ──────────────────────────────────────────────────
    if (sub === 'add') {
        const rest = args.slice(1).join(' ');
        const sep  = rest.indexOf(' | ');
        if (sep === -1) {
            return api.sendMessage(
                `❎ ${bold('Format:')} ${P}autoreply add [keyword] | [sagot]\n` +
                `📌 Example: ${P}autoreply add kumain ka na | Hindi pa, gutom pa!`,
                threadID, messageID
            );
        }
        const keyword = rest.substring(0, sep).trim();
        const reply   = rest.substring(sep + 3).trim();
        if (!keyword || !reply)
            return api.sendMessage(`❎ ${bold('Hindi pwedeng blangko!')}`, threadID, messageID);

        const existing = data.rules[threadID].find(r => norm(r.keyword) === norm(keyword));
        if (existing) {
            existing.replies.push(reply);
            saveData(data);
            return api.sendMessage(
                `✅ ${bold('Nadagdag ang bagong sagot!')}\n🔑 "${keyword}" → ${existing.replies.length} sagot`,
                threadID, messageID
            );
        }
        data.rules[threadID].push({ keyword, replies: [reply] });
        saveData(data);
        return api.sendMessage(
            `✅ ${bold('Na-add!')}\n🔑 "${keyword}"\n💬 "${reply}"`,
            threadID, messageID
        );
    }

    // ── REMOVE ───────────────────────────────────────────────────────────────
    if (sub === 'remove' || sub === 'delete') {
        const keyword = args.slice(1).join(' ').trim();
        if (!keyword) return api.sendMessage(`❎ Ilagay ang keyword na i-remove.`, threadID, messageID);
        const before = data.rules[threadID].length;
        data.rules[threadID] = data.rules[threadID].filter(r => norm(r.keyword) !== norm(keyword));
        if (data.rules[threadID].length === before)
            return api.sendMessage(`❎ ${bold('Keyword not found:')} "${keyword}"`, threadID, messageID);
        saveData(data);
        return api.sendMessage(`🗑️ ${bold('Na-remove:')} "${keyword}"`, threadID, messageID);
    }

    // ── LIST ─────────────────────────────────────────────────────────────────
    if (sub === 'list') {
        const rules   = data.rules[threadID] || [];
        const isOn    = data.enabled[threadID] === true;
        const roastOn = data.roastEnabled[threadID] === true;
        let msg =
            `╔══════════════════════════╗\n` +
            `║  🤖 ${bold('AUTO-REPLY STATUS')}  ║\n` +
            `╚══════════════════════════╝\n\n` +
            `🤖 ${bold('Status:')} ${isOn ? '✅ ON' : '❌ OFF'}\n` +
            `🔥 ${bold('Roast Mode:')} ${roastOn ? '✅ ON' : '❌ OFF'}\n` +
            `📊 ${bold('Custom Rules:')} ${rules.length}\n\n`;
        if (rules.length === 0) {
            msg += `😔 Wala pang custom rules.\n💡 ${P}autoreply add [keyword] | [sagot]`;
        } else {
            rules.forEach((r, i) => {
                msg += `${i + 1}. 🔑 ${bold(r.keyword)}\n`;
                r.replies.slice(0, 3).forEach((rep, j) => {
                    msg += `   ${j + 1}. ${rep.length > 50 ? rep.slice(0, 50) + '...' : rep}\n`;
                });
                if (r.replies.length > 3) msg += `   (+${r.replies.length - 3} more)\n`;
            });
        }
        return api.sendMessage(msg, threadID, messageID);
    }

    // ── CLEAR ────────────────────────────────────────────────────────────────
    if (sub === 'clear') {
        data.rules[threadID] = [];
        saveData(data);
        return api.sendMessage(`🧹 ${bold('Nai-clear ang lahat ng custom rules!')}`, threadID, messageID);
    }

    // ── DEFAULT help ─────────────────────────────────────────────────────────
    const isOn    = data.enabled[threadID] === true;
    const roastOn = data.roastEnabled[threadID] === true;
    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  🤖 ${bold('AUTO-REPLY SYSTEM')}      ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🤖 ${bold('Status:')} ${isOn ? '✅ ON' : '❌ OFF'}\n` +
        `🔥 ${bold('Roast Mode:')} ${roastOn ? '✅ ON' : '❌ OFF'}\n` +
        `📊 ${bold('Custom Rules:')} ${(data.rules[threadID] || []).length}\n\n` +
        `📋 ${bold('Commands:')}\n` +
        `• ${P}autoreply on / off\n` +
        `• ${P}autoreply roast on / off\n` +
        `• ${P}autoreply add [keyword] | [sagot]\n` +
        `• ${P}autoreply remove [keyword]\n` +
        `• ${P}autoreply list\n` +
        `• ${P}autoreply clear\n\n` +
        `💡 Kapag ON — bot mag-rereply sa bawat mensahe!`,
        threadID, messageID
    );
};

// ── handleEvent — fires on EVERY message when registered ─────────────────────
module.exports.handleEvent = async function ({ api, event }) {
    try {
        if (event.type !== 'message' && event.type !== 'message_reply') return;
        const { threadID, body, senderID } = event;
        if (!body || !body.trim()) return;

        // Ignore bot's own messages
        let botUID;
        try { botUID = String(api.getCurrentUserID()); } catch(e) { botUID = ''; }
        if (botUID && String(senderID) === botUID) return;

        // Ignore bot commands
        const P = global.config?.PREFIX || '!';
        if (body.trim().startsWith(P)) return;

        const data = loadData();

        // Check if enabled for this thread
        if (data.enabled[threadID] !== true) return;

        const rules   = data.rules[threadID] || [];
        const msgNorm = body.toLowerCase().trim();

        // ── 1. Custom keyword rules (highest priority, always fire) ──────────
        for (const rule of rules) {
            if (msgNorm.includes(norm(rule.keyword))) {
                const reply = rule.replies[Math.floor(Math.random() * rule.replies.length)];
                api.sendMessage(reply, threadID);
                return;
            }
        }

        // ── 2. Roast mode ON → always roast ──────────────────────────────────
        if (data.roastEnabled[threadID] === true) {
            api.sendMessage(randRoast(), threadID);
            return;
        }

        // ── 3. Normal auto-reply → 65% chance, friendly phrase ────────────────
        if (Math.random() <= 0.65) {
            api.sendMessage(randDefault(), threadID);
        }

    } catch(e) { /* never crash the listener */ }
};
