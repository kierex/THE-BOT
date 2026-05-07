/**
 * grouplock_event.js — Event handler para sa group name lock
 * Ito ang nagde-detect ng pagbabago ng pangalan at nagba-balik sa locked name
 * Kasama ng grouplock.js command
 * TEAM STARTCOPE BETA
 */

const fs = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const DATA_PATH = path.join(process.cwd(), 'utils/data/grouplock.json');

function loadData() {
    if (!fs.existsSync(DATA_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch (e) { return {}; }
}

module.exports.config = {
    name: 'grouplock_event',
    eventType: ['log:thread-name'],
    version: '1.0.0',
    credits: 'TEAM STARTCOPE BETA',
    description: 'Auto-revert group name kapag naka-lock — kasama ng grouplock command',
};

module.exports.run = async function ({ api, event }) {
    const { threadID } = event;
    const data = loadData();
    const entry = data[String(threadID)];
    if (!entry) return;

    const newName = event.logMessageData?.name || '';
    if (newName === entry.name) return;

    try {
        await api.setTitle(entry.name, threadID);
        api.sendMessage(
            `🔒 ${bold('GROUPLOCK ACTIVE!')}\n\n` +
            `⚠️ May nagtangkang baguhin ang pangalan ng group.\n` +
            `↩️ Ibinalik sa: "${bold(entry.name)}"\n\n` +
            `💡 I-type ang ${global.config.PREFIX}grouplock off kung gusto mong i-unlock.`,
            threadID
        );
    } catch (e) {
        console.log('[GroupLock Event] Error reverting name:', e.message);
    }
};
