/**
 * rich.js — Game Leaderboard (Real-time, file-based)
 * Tingnan kung sino ang pinaka-mayaman sa group
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

module.exports.config = {
    name:            'rich',
    version:         '1.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Ipakita ang game leaderboard — sino ang pinaka-mayaman!',
    commandCategory: 'Games',
    usages:          'rich | rich me',
    cooldowns:       5,
};

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (args[0]?.toLowerCase() === 'me') {
        if (!gdb.isRegistered(senderID)) {
            return api.sendMessage(
                `❌ ${bold('Hindi ka pa registered!')}\n` +
                `💡 I-type ang ${global.config.PREFIX}register para mag-join sa games.`,
                threadID, messageID
            );
        }
        const p    = gdb.getPlayer(senderID);
        const top  = gdb.getLeaderboard(100);
        const rank = top.findIndex(pl => pl.uid === String(senderID)) + 1;
        const wr   = p.gamesPlayed > 0
            ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0';
        return api.sendMessage(
            `╔══════════════════════════╗\n` +
            `║  👤 ${bold('IYONG STATS')}          ║\n` +
            `╚══════════════════════════╝\n\n` +
            `👤 ${bold('Pangalan:')} ${p.name}\n` +
            `🏅 ${bold('Rank:')} #${rank > 0 ? rank : 'N/A'}\n` +
            `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
            `🏆 ${bold('Wins:')} ${p.wins}\n` +
            `❌ ${bold('Losses:')} ${p.losses}\n` +
            `🤝 ${bold('Draws:')} ${p.draws}\n` +
            `🎮 ${bold('Games Played:')} ${p.gamesPlayed}\n` +
            `📊 ${bold('Win Rate:')} ${wr}%`,
            threadID, messageID
        );
    }

    const top   = gdb.getLeaderboard(10);
    const total = gdb.getTotalPlayers();

    if (top.length === 0) {
        return api.sendMessage(
            `╔══════════════════════════╗\n` +
            `║  💰 ${bold('LEADERBOARD')}        ║\n` +
            `╚══════════════════════════╝\n\n` +
            `😔 Wala pang nakapagrehistro!\n\n` +
            `💡 I-type ang ${global.config.PREFIX}register para maging una!`,
            threadID, messageID
        );
    }

    let msg =
        `╔══════════════════════════╗\n` +
        `║  💰 ${bold('COIN LEADERBOARD')}   ║\n` +
        `╚══════════════════════════╝\n\n` +
        `👥 ${bold('Total Players:')} ${total}\n` +
        `${'─'.repeat(30)}\n\n`;

    top.forEach((p, i) => {
        const wr = p.gamesPlayed > 0
            ? ((p.wins / p.gamesPlayed) * 100).toFixed(0) : '0';
        msg +=
            `${MEDALS[i]} ${bold(p.name)}\n` +
            `   💰 ${p.coins.toLocaleString()} coins | 🎮 ${p.gamesPlayed} games | WR ${wr}%\n\n`;
    });

    msg +=
        `${'─'.repeat(30)}\n` +
        `💡 ${global.config.PREFIX}rich me — stats mo\n` +
        `💡 ${global.config.PREFIX}register — sumali sa laro`;

    return api.sendMessage(msg, threadID, messageID);
};
