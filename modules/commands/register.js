/**
 * register.js — Mag-register para makapag-laro ng games
 * Libreng mag-register, makakakuha ng 100 starting coins
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

module.exports.config = {
    name:            'register',
    version:         '1.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Mag-register para makalaro ng games at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'register [name (optional)]',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event, args, Users }) {
    const { threadID, messageID, senderID } = event;

    if (gdb.isRegistered(senderID)) {
        const p = gdb.getPlayer(senderID);
        const wr = p.gamesPlayed > 0
            ? ((p.wins / p.gamesPlayed) * 100).toFixed(1)
            : '0.0';
        return api.sendMessage(
            `╔══════════════════════════╗\n` +
            `║  ✅ ${bold('REHISTRADO NA IKAW!')}  ║\n` +
            `╚══════════════════════════╝\n\n` +
            `👤 ${bold('Pangalan:')} ${p.name}\n` +
            `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
            `🏆 ${bold('Wins:')} ${p.wins} | ❌ ${bold('Losses:')} ${p.losses} | 🤝 ${bold('Draws:')} ${p.draws}\n` +
            `🎮 ${bold('Games Played:')} ${p.gamesPlayed}\n` +
            `📊 ${bold('Win Rate:')} ${wr}%\n\n` +
            `🎮 ${bold('Available games:')}\n` +
            `${global.config.PREFIX}rps • ${global.config.PREFIX}trivia • ${global.config.PREFIX}guess\n` +
            `${global.config.PREFIX}ttt • ${global.config.PREFIX}math\n\n` +
            `🏅 ${global.config.PREFIX}rich — leaderboard`,
            threadID, messageID
        );
    }

    let name = args.join(' ').trim();
    if (!name) {
        try {
            const userData = await Users?.getData(senderID);
            name = userData?.name || `Player_${senderID.slice(-4)}`;
        } catch(e) {
            name = `Player_${senderID.slice(-4)}`;
        }
    }

    const result = gdb.registerPlayer(senderID, name);
    if (!result.success) {
        return api.sendMessage(
            `✅ ${bold('Rehistrado ka na!')} Type ${global.config.PREFIX}register para makita ang stats.`,
            threadID, messageID
        );
    }

    return api.sendMessage(
        `╔══════════════════════════╗\n` +
        `║  🎉 ${bold('WELCOME PLAYER!')}      ║\n` +
        `╚══════════════════════════╝\n\n` +
        `✅ ${bold('Successfully registered!')}\n\n` +
        `👤 ${bold('Pangalan:')} ${name}\n` +
        `💰 ${bold('Starting Coins:')} 100\n\n` +
        `🎮 ${bold('Mga laro na pwede mo na i-play:')}\n` +
        `${global.config.PREFIX}rps — Bato-Bato-Pick (+50 coins per win)\n` +
        `${global.config.PREFIX}trivia — Trivia Quiz (+100 coins)\n` +
        `${global.config.PREFIX}guess — Number Guessing (+80 coins)\n` +
        `${global.config.PREFIX}ttt — Tic Tac Toe (+60 coins)\n` +
        `${global.config.PREFIX}math — Math Quiz (+30-80 coins)\n\n` +
        `🏅 ${global.config.PREFIX}rich — Tingnan ang leaderboard\n` +
        `💡 Makakita ng mas maraming coins = mas mataas sa leaderboard!`,
        threadID, messageID
    );
};
