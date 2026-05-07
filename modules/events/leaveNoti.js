/**
 * leaveNoti.js — Member leave notification
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

module.exports.config = {
    name:        'leaveNoti',
    eventType:   ['log:unsubscribe'],
    version:     '2.0.0',
    credits:     'TEAM STARTCOPE BETA',
    description: 'Notify when a user leaves or gets kicked from the group',
};

module.exports.run = async function ({ api, event, Users, Threads }) {
    try {
        const { threadID }  = event;
        const iduser        = event.logMessageData.leftParticipantFbId;
        if (iduser == api.getCurrentUserID()) return;

        let nameAuthor = '';
        let name       = `User ${String(iduser).slice(-4)}`;

        try {
            const userData = await Users?.getData(event.author);
            nameAuthor     = userData?.name || '';
        } catch {}

        try {
            const n = global.data.userName?.get(iduser);
            if (n) name = n;
            else {
                const u = await Users?.getData(iduser);
                if (u?.name) name = u.name;
            }
        } catch {}

        const isKicked = event.author !== iduser;
        const type     = isKicked
            ? `🦶 na-kick ni ${bold(nameAuthor || 'Admin')}`
            : `🚪 umalis sa group`;

        const now     = new Date();
        const options = { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' };
        const time    = now.toLocaleString('en-PH', options);

        return api.sendMessage(
            `╔══════════════════════════╗\n` +
            `║  🚪 ${bold('MEMBER LEFT')}          ║\n` +
            `╚══════════════════════════╝\n\n` +
            `👤 ${bold(name)}\n` +
            `${type}\n\n` +
            `🔗 fb.com/profile.php?id=${iduser}\n` +
            `⏰ ${time}\n\n` +
            (isKicked
                ? `😤 ${bold('Sige na!')} Bye bye!\n`
                : `😔 ${bold('Sayang!')} Paalam ${name}!\n`) +
            `⚡ — ${bold('TEAM STARTCOPE BETA')} — ⚡`,
            threadID
        );
    } catch(e) { /* silent */ }
};
