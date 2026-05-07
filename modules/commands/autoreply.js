/**
 * autoreply.js — Auto-reply na may keyword detection at built-in roast replies
 * Kapag ON, awtomatikong mag-rereply ang bot sa bawat mensahe ng members
 * May keyword rules, built-in roasts, at friendly default replies
 * Naka-save sa JSON database
 * TEAM STARTCOPE BETA
 */

const fs   = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const DATA_PATH = path.join(process.cwd(), 'utils/data/autoreply.json');

// ── Built-in roast phrases ────────────────────────────────────────────────────
const BUILT_IN_ROASTS = [
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
    "bro got left speechless","u trying to start something","bro got no sauce","u ain't tough fr",
    "bro got checked","u got no moves","bro got cooked daily","u sound tired already",
    "bro got no patience","u stay embarrassing yourself","bro got no direction",
    "u really pressed over that","bro got outplayed","u got no standards","bro got clowned easy",
    "u acting extra today","bro got no awareness","u moving reckless online","bro got no momentum",
    "u got laughed at","bro got no answer","u trying too much","bro got folded badly",
    "u got no cool points","bro got no strategy","u already confused lol","bro got exposed again",
    "u got no focus","bro got embarrassed again","u need better lines","bro got no confidence",
    "u sound salty rn","bro got no updates","u really doing this online","bro got no backup plan",
    "u ain't winning today","bro got no impact","u got shut down again","bro got no clue still",
    "u acting strange today","bro got no vision","u stay taking Ls","bro got no control",
    "u moving funny ngl","bro got cooked slowly","u sound lost rn","bro got no recovery",
    "u got handled quickly","bro got no excuses now","u talking in circles",
    "bro got no attention","u got ignored again","bro got no respect online",
    "u ain't making sense","bro got left hanging","u really thought u won",
    "bro got no luck today","u trying to save it now","bro got no skills",
    "u sound bothered lowkey","bro got folded publicly","u got no audience",
    "bro got no response left","u acting dramatic rn","bro got cooked completely",
    "u stay missing points","bro got no confidence left","u trying to look cool",
    "bro got left out","u got no patience today","bro got zero motion",
    "u sound goofy again","bro got caught again","u not making it better",
    "bro got no comeback ready","u got laughed off","bro got no plan","u moving emotional rn",
    "bro got no chance still","u talking nonsense again","bro got no awareness still",
    "u really typed that","bro got folded online","u got no control rn",
    "bro got no attention span","u sound angry lowkey","bro got no reason now",
    "u trying to force it","bro got no energy left","u got packed easily",
    "bro got no game plan","u already lost focus","bro got no confidence rn",
    "u stay saying random stuff","bro got no patience left","u got humbled online",
    "bro got no rhythm today","u ain't fooling nobody","bro got no balance today",
    "u acting wild online","bro got no support system","u got cooked once again",
    "bro got no escape","u really thought that worked","bro got no clue anymore",
    "u moving desperate rn","bro got no style points","u sound lost again",
    "bro got no words now","u trying too hard still","bro got no calm",
    "u already panicking lol","bro got no momentum now","u got no smoothness",
    "bro got shut down again","u sound pressed fr","bro got no energy today",
    "u got folded with ease","bro got no reactions left","u acting goofy online",
    "bro got no awareness today","u stay embarrassing yourself online",
    "bro got no hope now","u trying to recover badly","bro got no wins today",
    "u got no respect rn","bro got no answers still","u really crashing out",
    "bro got no chill today","u got smoked again","bro got no support left",
    "u typing mad fast rn","bro got no comeback loaded","u ain't helping yourself",
    "bro got no timing still","u really thought u cooked","bro got no direction today",
    "u moving weird again","bro got no strategy left","u got no aura today",
    "bro got no confidence anymore","u sound goofy lowkey","bro got no plan left",
    "u already confused again","bro got no rhythm anymore","u trying to save face",
    "bro got no game today","u got humbled once more","bro got no style rn",
    "u acting tough again","bro got no defense today","u got packed quickly",
    "bro got no balance rn","u stay taking losses","bro got no patience anymore",
    "u really doing too much","bro got no awareness rn","u got laughed at again",
    "bro got no backup anymore","u acting dramatic online","bro got no response still",
    "u trying to sound tough","bro got no motion today","u already folded lol",
];

// ── Default friendly auto-reply phrases (when roast mode OFF) ─────────────────
const DEFAULT_REPLIES = [
    "ano ba iyan 😏", "o sige sige 😂", "ay sus! 😅", "hala ka naman 🤣",
    "naks naman ah 😄", "okey lang yan bro 😎", "ganyan talaga buhay 😆",
    "char lang! 😂", "lol ok 😂", "ay nako 🙄", "grabe ka talaga 😂",
    "wow ha 🤩", "sige mo nga 😏", "jusko 😂", "hahaha fr 😂",
    "ikaw na 😅", "sigue na 😎", "talaga ba? 🤔", "oo na oo na 😂",
    "aminin mo na 😏", "ay nako ka 😂", "lol ok sige 😆",
    "oo naman 😊", "ay wow 😮", "pakialam ko ba 😂",
    "grabe naman 😂", "haha ok 😄", "sige bro 😎",
];

function loadData() {
    if (!fs.existsSync(DATA_PATH)) {
        fs.ensureDirSync(path.dirname(DATA_PATH));
        const init = { enabled: {}, roastEnabled: {}, rules: {} };
        fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2));
        return init;
    }
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); }
    catch(e) { return { enabled: {}, roastEnabled: {}, rules: {} }; }
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function normalize(text) { return text.toLowerCase().trim(); }
function randomRoast()   { return BUILT_IN_ROASTS[Math.floor(Math.random() * BUILT_IN_ROASTS.length)]; }
function randomDefault() { return DEFAULT_REPLIES[Math.floor(Math.random() * DEFAULT_REPLIES.length)]; }

module.exports.config = {
    name:            'autoreply',
    version:         '2.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Auto-reply sa lahat ng mensahe ng members kapag ON',
    commandCategory: 'Group',
    usages:          'autoreply [on/off/add/remove/list/clear/roast]',
    cooldowns:       3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const sub  = (args[0] || '').toLowerCase();
    const data = loadData();
    const P    = global.config.PREFIX;

    if (!data.rules[threadID])      data.rules[threadID]       = [];
    if (!data.roastEnabled)         data.roastEnabled           = {};
    if (typeof data.enabled[threadID] === 'undefined')      data.enabled[threadID]      = false;
    if (typeof data.roastEnabled[threadID] === 'undefined') data.roastEnabled[threadID] = false;

    if (sub === 'on') {
        data.enabled[threadID] = true;
        saveData(data);
        return api.sendMessage(
            `✅ ${bold('AUTO-REPLY: ON')}\n\n` +
            `🤖 Mag-rereply na ang bot sa LAHAT ng mensahe!\n` +
            `📋 Custom rules: ${data.rules[threadID].length}\n` +
            `💬 Built-in replies: ${DEFAULT_REPLIES.length} friendly + ${BUILT_IN_ROASTS.length} roasts\n\n` +
            `🔥 ${P}autoreply roast on — para gamitin ang roast replies\n` +
            `❌ ${P}autoreply off — para i-stop`,
            threadID, messageID
        );
    }

    if (sub === 'off') {
        data.enabled[threadID]      = false;
        data.roastEnabled[threadID] = false;
        saveData(data);
        return api.sendMessage(
            `❌ ${bold('AUTO-REPLY: OFF')}\n\n` +
            `🤖 Naka-off na ang auto-reply.\n` +
            `💡 ${P}autoreply on para i-activate ulit.`,
            threadID, messageID
        );
    }

    if (sub === 'roast') {
        const r = (args[1] || '').toLowerCase();
        if (r === 'on') {
            data.enabled[threadID]      = true;
            data.roastEnabled[threadID] = true;
            saveData(data);
            return api.sendMessage(
                `🔥 ${bold('ROAST MODE: ON')}\n\n` +
                `😂 Bot mag-roro-roast sa bawat mensahe!\n` +
                `💬 ${BUILT_IN_ROASTS.length} built-in roast lines\n\n` +
                `💡 Sample: "${randomRoast()}"\n\n` +
                `${P}autoreply roast off — para i-stop`,
                threadID, messageID
            );
        }
        if (r === 'off') {
            data.roastEnabled[threadID] = false;
            saveData(data);
            return api.sendMessage(
                `🔕 ${bold('ROAST MODE: OFF')}\n\n` +
                `😌 Hindi na mag-roro-roast.\n` +
                `(Auto-reply ay naka-on pa rin — gumagamit ng friendly replies)\n` +
                `💡 ${P}autoreply off — para i-off completely`,
                threadID, messageID
            );
        }
        const isRoast = data.roastEnabled[threadID];
        return api.sendMessage(
            `🔥 ${bold('ROAST MODE:')} ${isRoast ? '✅ ON' : '❌ OFF'}\n` +
            `💬 ${BUILT_IN_ROASTS.length} built-in roasts\n` +
            `💡 Sample: "${randomRoast()}"`,
            threadID, messageID
        );
    }

    if (sub === 'add') {
        const rest = args.slice(1).join(' ');
        const sep  = rest.indexOf(' | ');
        if (sep === -1) {
            return api.sendMessage(
                `❎ ${bold('Mali ang format!')}\n\n` +
                `✅ ${P}autoreply add [keyword] | [sagot]\n` +
                `📌 Example:\n${P}autoreply add kumain ka na | Hindi pa! Gutom pa!`,
                threadID, messageID
            );
        }
        const keyword = rest.substring(0, sep).trim();
        const reply   = rest.substring(sep + 3).trim();
        if (!keyword || !reply)
            return api.sendMessage(`❎ ${bold('Hindi pwedeng blangko!')}`, threadID, messageID);
        const existing = data.rules[threadID].find(r => normalize(r.keyword) === normalize(keyword));
        if (existing) {
            existing.replies.push(reply);
            saveData(data);
            return api.sendMessage(
                `✅ ${bold('Nadagdag ang bagong sagot!')}\n🔑 "${keyword}" → ${existing.replies.length} sagot na`,
                threadID, messageID
            );
        }
        data.rules[threadID].push({ keyword, replies: [reply], addedBy: senderID });
        saveData(data);
        return api.sendMessage(
            `✅ ${bold('Na-add ang auto-reply rule!')}\n🔑 "${keyword}"\n💬 "${reply}"`,
            threadID, messageID
        );
    }

    if (sub === 'remove' || sub === 'delete') {
        const keyword = args.slice(1).join(' ').trim();
        if (!keyword)
            return api.sendMessage(`❎ ${bold('Ilagay ang keyword na i-remove.')}`, threadID, messageID);
        const before = data.rules[threadID].length;
        data.rules[threadID] = data.rules[threadID].filter(r => normalize(r.keyword) !== normalize(keyword));
        if (data.rules[threadID].length === before)
            return api.sendMessage(`❎ ${bold('Keyword not found:')} "${keyword}"`, threadID, messageID);
        saveData(data);
        return api.sendMessage(`🗑️ ${bold('Na-remove:')} "${keyword}"`, threadID, messageID);
    }

    if (sub === 'list') {
        const rules   = data.rules[threadID];
        const isOn    = data.enabled[threadID] === true;
        const roastOn = data.roastEnabled[threadID] === true;
        let msg =
            `╔══════════════════════════╗\n` +
            `║  🤖 ${bold('AUTO-REPLY STATUS')}  ║\n` +
            `╚══════════════════════════╝\n\n` +
            `🤖 ${bold('Status:')} ${isOn ? '✅ ON' : '❌ OFF'}\n` +
            `🔥 ${bold('Roast Mode:')} ${roastOn ? '✅ ON' : '❌ OFF'}\n` +
            `📊 ${bold('Custom Rules:')} ${rules.length}\n` +
            `💬 ${bold('Built-in:')} ${BUILT_IN_ROASTS.length} roasts + ${DEFAULT_REPLIES.length} friendly\n\n`;
        if (rules.length === 0) {
            msg += `😔 Wala pang custom rules.\n💡 ${P}autoreply add [keyword] | [sagot]`;
        } else {
            rules.forEach((r, i) => {
                msg += `${i + 1}. 🔑 ${bold(r.keyword)}\n`;
                r.replies.forEach((rep, j) => {
                    msg += `   ${j + 1}. ${rep.length > 50 ? rep.slice(0, 50) + '...' : rep}\n`;
                });
            });
        }
        return api.sendMessage(msg, threadID, messageID);
    }

    if (sub === 'clear') {
        data.rules[threadID] = [];
        saveData(data);
        return api.sendMessage(`🧹 ${bold('Nai-clear ang lahat ng custom rules!')}`, threadID, messageID);
    }

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
        `• ${P}autoreply on/off\n` +
        `• ${P}autoreply roast on/off\n` +
        `• ${P}autoreply add [keyword] | [sagot]\n` +
        `• ${P}autoreply remove [keyword]\n` +
        `• ${P}autoreply list\n` +
        `• ${P}autoreply clear\n\n` +
        `💡 Kapag ON, bot awtomatikong mag-rereply sa bawat mensahe!`,
        threadID, messageID
    );
};

// ── Event handler — fires on every message when autoreply is ON ───────────────
module.exports.handleEvent = async function ({ api, event }) {
    if (event.type !== 'message' && event.type !== 'message_reply') return;
    const { threadID, body, senderID, messageID } = event;
    if (!body || !body.trim()) return;

    const botUID = String(api.getCurrentUserID());
    if (String(senderID) === botUID) return;

    // Ignore bot commands
    const P = global.config.PREFIX;
    if (body.startsWith(P)) return;

    const data = loadData();
    if (!data.roastEnabled) data.roastEnabled = {};

    if (data.enabled[threadID] !== true) return;

    const rules   = data.rules[threadID] || [];
    const msgNorm = body.toLowerCase().trim();

    // ── Custom keyword rules have highest priority ────────────────────────────
    for (const rule of rules) {
        if (msgNorm.includes(rule.keyword.toLowerCase().trim())) {
            const reply = rule.replies[Math.floor(Math.random() * rule.replies.length)];
            try { await api.sendMessage({ body: reply }, threadID, messageID); }
            catch(e) { /* silent */ }
            return;
        }
    }

    // ── No keyword match — use roast OR default reply ─────────────────────────
    const roastOn = data.roastEnabled[threadID] === true;

    if (roastOn) {
        // Roast mode: always reply with roast
        try { await api.sendMessage({ body: randomRoast() }, threadID, messageID); }
        catch(e) { /* silent */ }
    } else {
        // Normal auto-reply: fire 65% of the time with friendly reply
        if (Math.random() > 0.65) return;
        try { await api.sendMessage({ body: randomDefault() }, threadID, messageID); }
        catch(e) { /* silent */ }
    }
};
