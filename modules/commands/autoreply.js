/**
 * autoreply.js — Auto-reply na may keyword detection at built-in roast replies
 * Mag-detect ng text at awtomatikong mag-reply ng customized na mensahe
 * May on/off toggle at infinite na pwedeng i-add na replies
 * Naka-save sa JSON database
 * TEAM STARTCOPE BETA
 */

const fs = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const DATA_PATH = path.join(process.cwd(), 'utils/data/autoreply.json');

// ── Built-in roast / auto-reply phrases ──────────────────────────────────────
const BUILT_IN_ROASTS = [
    "lol sybau gng",
    "u talk too much lol",
    "bro thought he cooked",
    "u not scary ngl",
    "calm down lil bro",
    "u funny for that",
    "stay in yo lane",
    "bro got no aim",
    "u really tried huh",
    "don't start crying now",
    "u all talk fr",
    "bro think he famous",
    "u lost already",
    "weak comeback ngl",
    "u typing too fast lol",
    "bro got no chill",
    "that was kinda sad",
    "u got cooked bro",
    "don't bark too loud",
    "bro mad for nothing",
    "u doing too much",
    "that ain't it chief",
    "bro got folded",
    "u built different bad",
    "stop yapping lol",
    "u not him bro",
    "bro think he slick",
    "u got no motion",
    "stay mad lil bro",
    "bro got packed up",
    "not the flex u think",
    "u goofy ngl",
    "bro got carried",
    "u tryna fit in",
    "calm yo self lol",
    "bro got no wins",
    "u weird for that",
    "bro got silence after",
    "u thought u ate",
    "that was embarrassing ngl",
    "bro got no comeback",
    "u loud and wrong",
    "bro really pressed",
    "u doing side quests",
    "not bro again lol",
    "u got humbled quick",
    "bro fell off",
    "don't cry now bro",
    "u acting tough online",
    "bro lost the plot",
    "u not cooking anything",
    "bro got ratioed",
    "u tried your best maybe",
    "bro got no aura",
    "u sound confused ngl",
    "bro stay losing",
    "u ain't winning this",
    "bro got scared lowkey",
    "stop acting hard lol",
    "u got smoked easy",
    "bro need backup",
    "u typing paragraphs now",
    "bro got exposed quick",
    "u thought that hit",
    "bro got no clue",
    "u really proud of that",
    "bro got denied",
    "u too emotional lol",
    "bro got dropped",
    "u not built for this",
    "bro got quiet fast",
    "u moving weird ngl",
    "bro need practice",
    "u got no game",
    "bro acting famous",
    "u got folded instantly",
    "bro got no timing",
    "u ain't slick bro",
    "bro got caught lacking",
    "u trying too hard",
    "bro need to log off",
    "u got no chance",
    "bro got roasted easy",
    "u funny looking rn",
    "bro got skipped",
    "u stay talking nonsense",
    "bro got no energy",
    "u really thought huh",
    "bro need a reboot",
    "u got cooked instantly",
    "bro got no style",
    "u ain't intimidating nobody",
    "bro got ignored",
    "u sound silly rn",
    "bro got shutdown quick",
    "u trying to be relevant",
    "bro lost again lol",
    "u got no response now",
    "bro need new lines",
    "u acting brand new",
    "bro got embarrassed hard",
    "u too loud online",
    "bro got left behind",
    "u not serious rn",
    "bro got no defense",
    "u already lost bro",
    "bro got frozen",
    "u doing clown activities",
    "bro got muted mentally",
    "u can't be real rn",
    "bro got no balance",
    "u sound mad lowkey",
    "bro got no support",
    "u got handled easy",
    "bro moving desperate",
    "u ain't built like that",
    "bro got played",
    "u keep missing lol",
    "bro got no drip",
    "u really confident huh",
    "bro got shut down",
    "u sound goofy today",
    "bro got no signal",
    "u overthinking everything",
    "bro got deleted",
    "u still talking lol",
    "bro got no luck",
    "u got folded twice",
    "bro got no reaction",
    "u tripping again",
    "bro got lost quick",
    "u really made that up",
    "bro got zero points",
    "u acting funny now",
    "bro got turned around",
    "u got no rhythm",
    "bro got left speechless",
    "u trying to start something",
    "bro got no sauce",
    "u ain't tough fr",
    "bro got checked",
    "u got no moves",
    "bro got cooked daily",
    "u sound tired already",
    "bro got no patience",
    "u stay embarrassing yourself",
    "bro got no direction",
    "u really pressed over that",
    "bro got outplayed",
    "u got no standards",
    "bro got clowned easy",
    "u acting extra today",
    "bro got no awareness",
    "u moving reckless online",
    "bro got no momentum",
    "u got laughed at",
    "bro got no answer",
    "u trying too much",
    "bro got folded badly",
    "u got no cool points",
    "bro got no strategy",
    "u already confused lol",
    "bro got exposed again",
    "u got no focus",
    "bro got embarrassed again",
    "u need better lines",
    "bro got no confidence",
    "u sound salty rn",
    "bro got no updates",
    "u really doing this online",
    "bro got no backup plan",
    "u ain't winning today",
    "bro got no impact",
    "u got shut down again",
    "bro got no clue still",
    "u acting strange today",
    "bro got no vision",
    "u stay taking Ls",
    "bro got no control",
    "u moving funny ngl",
    "bro got cooked slowly",
    "u sound lost rn",
    "bro got no recovery",
    "u got handled quickly",
    "bro got no excuses now",
    "u talking in circles",
    "bro got no attention",
    "u got ignored again",
    "bro got no respect online",
    "u ain't making sense",
    "bro got left hanging",
    "u really thought u won",
    "bro got no luck today",
    "u trying to save it now",
    "bro got no skills",
    "u sound bothered lowkey",
    "bro got folded publicly",
    "u got no audience",
    "bro got no response left",
    "u acting dramatic rn",
    "bro got cooked completely",
    "u stay missing points",
    "bro got no confidence left",
    "u trying to look cool",
    "bro got left out",
    "u got no patience today",
    "bro got zero motion",
    "u sound goofy again",
    "bro got caught again",
    "u not making it better",
    "bro got no comeback ready",
    "u got laughed off",
    "bro got no plan",
    "u moving emotional rn",
    "bro got no chance still",
    "u talking nonsense again",
    "bro got no awareness still",
    "u really typed that",
    "bro got folded online",
    "u got no control rn",
    "bro got no attention span",
    "u sound angry lowkey",
    "bro got no reason now",
    "u trying to force it",
    "bro got no energy left",
    "u got packed easily",
    "bro got no game plan",
    "u already lost focus",
    "bro got no confidence rn",
    "u stay saying random stuff",
    "bro got no patience left",
    "u got humbled online",
    "bro got no rhythm today",
    "u ain't fooling nobody",
    "bro got no balance today",
    "u acting wild online",
    "bro got no support system",
    "u got cooked once again",
    "bro got no escape",
    "u really thought that worked",
    "bro got no clue anymore",
    "u moving desperate rn",
    "bro got no style points",
    "u sound lost again",
    "bro got no words now",
    "u trying too hard still",
    "bro got no calm",
    "u already panicking lol",
    "bro got no momentum now",
    "u got no smoothness",
    "bro got shut down again",
    "u sound pressed fr",
    "bro got no energy today",
    "u got folded with ease",
    "bro got no reactions left",
    "u acting goofy online",
    "bro got no awareness today",
    "u stay embarrassing yourself online",
    "bro got no hope now",
    "u trying to recover badly",
    "bro got no wins today",
    "u got no respect rn",
    "bro got no answers still",
    "u really crashing out",
    "bro got no chill today",
    "u got smoked again",
    "bro got no support left",
    "u typing mad fast rn",
    "bro got no comeback loaded",
    "u ain't helping yourself",
    "bro got no timing still",
    "u really thought u cooked",
    "bro got no direction today",
    "u moving weird again",
    "bro got no strategy left",
    "u got no aura today",
    "bro got no confidence anymore",
    "u sound goofy lowkey",
    "bro got no plan left",
    "u already confused again",
    "bro got no rhythm anymore",
    "u trying to save face",
    "bro got no game today",
    "u got humbled once more",
    "bro got no style rn",
    "u acting tough again",
    "bro got no defense today",
    "u got packed quickly",
    "bro got no balance rn",
    "u stay taking losses",
    "bro got no patience anymore",
    "u really doing too much",
    "bro got no awareness rn",
    "u got laughed at again",
    "bro got no backup anymore",
    "u acting dramatic online",
    "bro got no response still",
    "u trying to sound tough",
    "bro got no motion today",
    "u already folded lol",
    "bro got no calm left",
    "u sound funny rn",
    "bro got no updates today",
    "u got cooked badly again",
    "bro got no control today",
    "u ain't making progress",
    "bro got no cool points left",
    "u stay talking crazy",
    "bro got no recovery now",
    "u really thought u won again",
    "bro got no reason left",
    "u acting silly rn",
    "bro got no game left",
    "u got exposed once more",
    "bro got no focus anymore",
    "u sound mad online",
    "bro got no patience rn",
    "u trying too hard again",
    "bro got no smooth moves",
    "u got handled once again",
    "bro got no confidence today",
    "u really not helping yourself",
    "bro got no awareness anymore",
    "u got folded instantly again",
    "bro got no timing today",
    "u stay embarrassing yourself fr",
    "bro got no defense left",
    "u moving funny today",
    "bro got no support rn",
    "u got roasted easily again",
    "bro got no strategy today",
    "u really typing all that",
    "bro got no energy anymore",
    "u sound pressed again",
    "bro got no clue today",
    "u got humbled quickly again",
    "bro got no answers anymore",
    "u trying to act cool",
    "bro got no momentum today",
    "u already losing focus",
    "bro got no escape today",
    "u acting goofy still",
    "bro got no vision anymore",
    "u got packed up again",
    "bro got no response ready",
    "u sound emotional rn",
    "bro got no support today",
    "u trying to look tough",
    "bro got no chill anymore",
    "u got smoked quickly again",
    "bro got no style today",
    "u really lost already",
    "bro got no awareness left",
    "u stay acting weird",
    "bro got no patience today",
    "u got laughed off again",
    "bro got no control anymore",
    "u acting extra online",
    "bro got no confidence left today",
    "u really not scary",
    "bro got no moves anymore",
    "u got cooked online again",
    "bro got no timing anymore",
    "u sound lost today",
    "bro got no energy rn",
    "u trying too much still",
    "bro got no balance anymore",
    "u got handled online",
    "bro got no calm today",
    "u already folded again",
    "bro got no answers today",
    "u acting funny again",
    "bro got no cool left",
    "u got humbled publicly",
    "bro got no direction rn",
    "u stay talking nonsense fr",
    "bro got no game anymore",
    "u really typing novels now",
    "bro got no patience still",
    "u got packed instantly",
    "bro got no support anymore",
    "u sound goofy today fr",
    "bro got no comeback still",
    "u trying to force jokes",
    "bro got no style anymore",
    "u already panicking again",
    "bro got no momentum anymore",
    "u got laughed at publicly",
    "bro got no defense anymore",
    "u acting emotional online",
    "bro got no reason today",
    "u really doing side quests",
    "bro got no strategy anymore",
    "u got smoked publicly",
    "bro got no focus today",
    "u sound salty again",
    "bro got no awareness today fr",
    "u trying to sound smart",
    "bro got no confidence anymore today",
    "u got folded in seconds",
    "bro got no smoothness left",
    "u stay saying random things",
    "bro got no rhythm rn",
    "u acting dramatic again",
    "bro got no support system today",
    "u got roasted publicly",
    "bro got no clue left",
    "u really lost the plot",
    "bro got no answers ready",
    "u trying to recover still",
    "bro got no patience left today",
    "u got packed once more",
    "bro got no balance left",
    "u acting goofy publicly",
    "bro got no cool points today",
    "u really thought that landed",
    "bro got no game plan left",
    "u got handled publicly",
    "bro got no awareness left today",
    "u sound angry again",
    "bro got no style points left",
    "u trying to look important",
    "bro got no recovery today",
    "u got laughed off publicly",
    "bro got no confidence rn today",
    "u really typing with emotions",
    "bro got no timing left",
    "u stay acting tough online",
    "bro got no direction anymore today",
    "u got humbled in public",
    "bro got no calm anymore today",
    "u acting strange again",
    "bro got no focus left",
    "u got folded publicly again",
    "bro got no game today fr",
    "u trying too hard publicly",
    "bro got no support left today",
    "u sound goofy publicly",
    "bro got no control left",
    "u got packed with ease",
    "bro got no momentum left",
    "u really embarrassing yourself again",
    "bro got no awareness publicly",
    "u acting silly online again",
    "bro got no answers left today",
    "u got smoked instantly publicly",
    "bro got no confidence publicly",
    "u stay moving weird",
    "bro got no balance publicly",
    "u really thought u snapped",
    "bro got no energy publicly",
    "u got laughed at instantly",
    "bro got no comeback anymore today",
    "u acting extra publicly",
    "bro got no patience publicly",
    "u got handled instantly",
    "bro got no strategy publicly",
    "u really sound bothered",
    "bro got no smooth moves left",
    "u got folded with no effort",
    "bro got no vision publicly",
    "u acting goofy for free",
    "bro got no rhythm publicly",
    "u got roasted in seconds",
    "bro got no chill publicly",
    "u really lost this one",
    "bro got no support publicly",
    "u acting emotional again online",
    "bro got no reason publicly",
    "u got packed in public",
    "bro got no style publicly",
    "u really thought u ate again",
    "bro got no timing publicly",
    "u sound lost publicly",
    "bro got no game publicly",
    "u got smoked with ease",
    "bro got no focus publicly",
    "u trying to save yourself",
    "bro got no awareness publicly today",
    "u acting weird publicly",
    "bro got no defense publicly",
    "u got handled easily publicly",
    "bro got no momentum publicly today",
    "u really typing nonsense again",
    "bro got no confidence publicly today",
    "u acting goofy once again",
    "bro got no strategy left today",
    "u got humbled instantly publicly",
    "bro got no patience anymore publicly",
    "u really trying hard today",
    "bro got no balance anymore publicly",
    "u got laughed at badly",
    "bro got no answers publicly today",
    "u acting funny publicly again",
    "bro got no game plan publicly",
    "u got folded publicly today",
    "bro got no smoothness publicly",
    "u really doing too much today",
    "bro got no support publicly anymore",
    "u got roasted publicly today",
    "bro got no comeback at all",
];

function loadData() {
    if (!fs.existsSync(DATA_PATH)) {
        fs.ensureDirSync(path.dirname(DATA_PATH));
        const init = { enabled: {}, rules: {} };
        fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2), 'utf8');
        return init;
    }
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch (e) { return { enabled: {}, rules: {} }; }
}

function saveData(data) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function normalize(text) {
    return text.toLowerCase().trim();
}

function randomRoast() {
    return BUILT_IN_ROASTS[Math.floor(Math.random() * BUILT_IN_ROASTS.length)];
}

module.exports.config = {
    name: 'autoreply',
    version: '1.1.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Auto-reply na may keyword detection at built-in roast replies',
    commandCategory: 'Group',
    usages: 'autoreply [on/off/add/remove/list/clear/roast]',
    cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const sub = (args[0] || '').toLowerCase();
    const data = loadData();

    if (!data.rules[threadID]) data.rules[threadID] = [];
    if (typeof data.enabled[threadID] === 'undefined') data.enabled[threadID] = true;
    if (typeof data.roastEnabled === 'undefined') data.roastEnabled = {};
    if (typeof data.roastEnabled[threadID] === 'undefined') data.roastEnabled[threadID] = false;

    // ── ON/OFF ───────────────────────────────────────────────────────────────
    if (sub === 'on') {
        data.enabled[threadID] = true;
        saveData(data);
        return api.sendMessage(
            `✅ ${bold('AUTO-REPLY: ON')}\n\n` +
            `🤖 Aktibo na ang auto-reply sa group na ito!\n` +
            `📋 May ${data.rules[threadID].length} custom rules na naka-save.\n\n` +
            `💡 Gamitin ang ${global.config.PREFIX}autoreply list para makita lahat.`,
            threadID, messageID
        );
    }

    if (sub === 'off') {
        data.enabled[threadID] = false;
        saveData(data);
        return api.sendMessage(
            `❌ ${bold('AUTO-REPLY: OFF')}\n\n` +
            `🤖 Naka-off na ang auto-reply sa group na ito.\n` +
            `💡 I-type ang ${global.config.PREFIX}autoreply on para i-activate ulit.`,
            threadID, messageID
        );
    }

    // ── ROAST MODE ON/OFF ─────────────────────────────────────────────────────
    if (sub === 'roast') {
        const roastSub = (args[1] || '').toLowerCase();
        if (roastSub === 'on') {
            data.roastEnabled[threadID] = true;
            saveData(data);
            return api.sendMessage(
                `🔥 ${bold('ROAST MODE: ON ✅')}\n\n` +
                `😂 Ang bot ay magroro-roast na sa random na tao sa group!\n` +
                `💬 May ${BUILT_IN_ROASTS.length} built-in roast lines.\n\n` +
                `💡 ${global.config.PREFIX}autoreply roast off para i-stop.`,
                threadID, messageID
            );
        }
        if (roastSub === 'off') {
            data.roastEnabled[threadID] = false;
            saveData(data);
            return api.sendMessage(
                `🔕 ${bold('ROAST MODE: OFF')}\n\n` +
                `😌 Hindi na mag-roro-roast ang bot.\n` +
                `💡 ${global.config.PREFIX}autoreply roast on para i-activate ulit.`,
                threadID, messageID
            );
        }
        return api.sendMessage(
            `╔══════════════════════╗\n` +
            `║  🔥 ${bold('ROAST MODE')}       ║\n` +
            `╚══════════════════════╝\n\n` +
            `🔥 ${bold('Status:')} ${data.roastEnabled[threadID] ? '✅ ON' : '❌ OFF'}\n` +
            `💬 ${bold('Built-in Roasts:')} ${BUILT_IN_ROASTS.length} lines\n\n` +
            `• ${global.config.PREFIX}autoreply roast on — i-activate\n` +
            `• ${global.config.PREFIX}autoreply roast off — i-deactivate\n\n` +
            `💡 Sample: "${randomRoast()}"`,
            threadID, messageID
        );
    }

    // ── ADD ──────────────────────────────────────────────────────────────────
    if (sub === 'add') {
        const rest = args.slice(1).join(' ');
        const separator = rest.indexOf(' | ');
        if (separator === -1) {
            return api.sendMessage(
                `❎ ${bold('Mali ang format!')}\n\n` +
                `✅ ${bold('Tamang format:')}\n` +
                `${global.config.PREFIX}autoreply add [keyword] | [sagot]\n\n` +
                `📌 ${bold('Halimbawa:')}\n` +
                `${global.config.PREFIX}autoreply add kumain ka na | Hindi pa! Gutom na ko! 😂`,
                threadID, messageID
            );
        }
        const keyword = rest.substring(0, separator).trim();
        const reply = rest.substring(separator + 3).trim();
        if (!keyword || !reply) {
            return api.sendMessage(`❎ ${bold('Hindi pwedeng blangko ang keyword o sagot!')}`, threadID, messageID);
        }
        const existing = data.rules[threadID].find(r => normalize(r.keyword) === normalize(keyword));
        if (existing) {
            existing.replies.push(reply);
            saveData(data);
            return api.sendMessage(
                `✅ ${bold('Nadagdag na ang bagong sagot!')}\n\n` +
                `🔑 ${bold('Keyword:')} "${keyword}"\n` +
                `💬 ${bold('Bagong sagot:')} "${reply}"\n` +
                `📊 ${bold('Kabuuang sagot para sa keyword na ito:')} ${existing.replies.length}`,
                threadID, messageID
            );
        }
        data.rules[threadID].push({ keyword, replies: [reply], addedBy: senderID, createdAt: Date.now() });
        saveData(data);
        return api.sendMessage(
            `✅ ${bold('Na-add na ang auto-reply rule!')}\n\n` +
            `🔑 ${bold('Keyword:')} "${keyword}"\n` +
            `💬 ${bold('Sagot:')} "${reply}"\n` +
            `📊 ${bold('Kabuuang rules sa group:')} ${data.rules[threadID].length}`,
            threadID, messageID
        );
    }

    // ── REMOVE ───────────────────────────────────────────────────────────────
    if (sub === 'remove' || sub === 'delete') {
        const keyword = args.slice(1).join(' ').trim();
        if (!keyword) return api.sendMessage(`❎ ${bold('Ilagay ang keyword na gusto mong i-remove.')}`, threadID, messageID);
        const before = data.rules[threadID].length;
        data.rules[threadID] = data.rules[threadID].filter(r => normalize(r.keyword) !== normalize(keyword));
        if (data.rules[threadID].length === before) {
            return api.sendMessage(`❎ ${bold('Keyword not found:')} "${keyword}"`, threadID, messageID);
        }
        saveData(data);
        return api.sendMessage(
            `🗑️ ${bold('Na-remove na ang auto-reply rule!')}\n\n` +
            `🔑 ${bold('Keyword:')} "${keyword}"\n` +
            `📊 ${bold('Natira pang rules:')} ${data.rules[threadID].length}`,
            threadID, messageID
        );
    }

    // ── LIST ─────────────────────────────────────────────────────────────────
    if (sub === 'list') {
        const rules = data.rules[threadID];
        const isOn = data.enabled[threadID] !== false;
        const roastOn = data.roastEnabled?.[threadID] === true;
        if (!rules || rules.length === 0) {
            return api.sendMessage(
                `📋 ${bold('AUTO-REPLY RULES')}\n\n` +
                `🤖 ${bold('Status:')} ${isOn ? '✅ ON' : '❌ OFF'}\n` +
                `🔥 ${bold('Roast Mode:')} ${roastOn ? '✅ ON' : '❌ OFF'}\n` +
                `💬 ${bold('Built-in Roasts:')} ${BUILT_IN_ROASTS.length} lines\n\n` +
                `❎ Wala pang custom rules sa group na ito.\n` +
                `💡 Gamitin ang ${global.config.PREFIX}autoreply add [keyword] | [sagot] para mag-add.`,
                threadID, messageID
            );
        }
        let msg = `╔══════════════════════╗\n║  🤖 ${bold('AUTO-REPLY RULES')}  ║\n╚══════════════════════╝\n\n`;
        msg += `🤖 ${bold('Status:')} ${isOn ? '✅ ON' : '❌ OFF'}\n`;
        msg += `🔥 ${bold('Roast Mode:')} ${roastOn ? '✅ ON' : '❌ OFF'}\n`;
        msg += `📊 ${bold('Custom Rules:')} ${rules.length}\n`;
        msg += `💬 ${bold('Built-in Roasts:')} ${BUILT_IN_ROASTS.length} lines\n\n`;
        msg += `${'─'.repeat(30)}\n`;
        rules.forEach((r, i) => {
            msg += `${i + 1}. 🔑 ${bold(r.keyword)}\n`;
            r.replies.forEach((rep, j) => {
                msg += `   ${j + 1}. ${rep.length > 50 ? rep.substring(0, 50) + '...' : rep}\n`;
            });
            msg += `${'─'.repeat(30)}\n`;
        });
        msg += `\n💡 ${global.config.PREFIX}autoreply add [keyword] | [sagot]`;
        return api.sendMessage(msg, threadID, messageID);
    }

    // ── CLEAR ────────────────────────────────────────────────────────────────
    if (sub === 'clear') {
        data.rules[threadID] = [];
        saveData(data);
        return api.sendMessage(
            `🧹 ${bold('Nai-clear na lahat ng custom auto-reply rules!')}\n` +
            `💬 Built-in roast lines (${BUILT_IN_ROASTS.length}) ay nananatili.`,
            threadID, messageID
        );
    }

    // ── HELP ─────────────────────────────────────────────────────────────────
    const isOn = data.enabled[threadID] !== false;
    const roastOn = data.roastEnabled?.[threadID] === true;
    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  🤖 ${bold('AUTO-REPLY SYSTEM')}        ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🤖 ${bold('Status:')} ${isOn ? '✅ ON' : '❌ OFF'}\n` +
        `🔥 ${bold('Roast Mode:')} ${roastOn ? '✅ ON' : '❌ OFF'}\n` +
        `📊 ${bold('Custom Rules:')} ${(data.rules[threadID] || []).length}\n` +
        `💬 ${bold('Built-in Roasts:')} ${BUILT_IN_ROASTS.length} lines\n\n` +
        `📋 ${bold('Mga Commands:')}\n` +
        `${'─'.repeat(32)}\n` +
        `• ${global.config.PREFIX}autoreply on/off\n` +
        `• ${global.config.PREFIX}autoreply roast on/off — toggle roast mode\n` +
        `• ${global.config.PREFIX}autoreply add [keyword] | [sagot]\n` +
        `• ${global.config.PREFIX}autoreply remove [keyword]\n` +
        `• ${global.config.PREFIX}autoreply list\n` +
        `• ${global.config.PREFIX}autoreply clear\n\n` +
        `💡 Sample roast: "${randomRoast()}"`,
        threadID, messageID
    );
};

module.exports.handleEvent = async function ({ api, event }) {
    if (event.type !== 'message' && event.type !== 'message_reply') return;
    const { threadID, body, senderID } = event;
    if (!body || !body.trim()) return;
    if (senderID === api.getCurrentUserID()) return;

    const data = loadData();
    if (!data.roastEnabled) data.roastEnabled = {};
    if (data.enabled[threadID] === false) return;

    // ── Check custom keyword rules first ──────────────────────────────────────
    const rules = data.rules[threadID];
    const msgNorm = normalize(body);
    let matched = null;

    if (rules && rules.length > 0) {
        for (const rule of rules) {
            const kw = normalize(rule.keyword);
            if (msgNorm.includes(kw)) {
                matched = rule;
                break;
            }
        }
    }

    if (matched && matched.replies && matched.replies.length > 0) {
        const reply = matched.replies[Math.floor(Math.random() * matched.replies.length)];
        try {
            await api.sendMessage({ body: reply }, threadID, event.messageID);
        } catch (e) { /* silent */ }
        return;
    }

    // ── Roast mode — random roast reply to any message ────────────────────────
    if (data.roastEnabled[threadID] === true) {
        // Only fire 40% of the time to avoid spamming
        if (Math.random() > 0.40) return;
        try {
            await api.sendMessage({ body: randomRoast() }, threadID, event.messageID);
        } catch (e) { /* silent */ }
    }
};
