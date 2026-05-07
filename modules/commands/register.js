/**
 * register.js — Mag-register para makapag-laro ng games
 * Libre — makakakuha ng 100 starting coins
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

module.exports.config = {
    name:            'register',
    version:         '2.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Mag-register para makalaro ng games at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'register [name (optional)]',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const P = global.config.PREFIX;

    // ── Already registered → show stats ──────────────────────────────────────
    if (gdb.isRegistered(senderID)) {
        const p  = gdb.getPlayer(senderID);
        const wr = p.gamesPlayed > 0
            ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0';
        return api.sendMessage(
            `╔══════════════════════════╗\n` +
            `║  ✅ ${bold('REHISTRADO NA IKAW!')}  ║\n` +
            `╚══════════════════════════╝\n\n` +
            `👤 ${bold('Pangalan:')} ${p.name}\n` +
            `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
            `🏆 ${bold('Wins:')} ${p.wins} | ❌ ${bold('Losses:')} ${p.losses} | 🤝 ${bold('Draws:')} ${p.draws}\n` +
            `🎮 ${bold('Games Played:')} ${p.gamesPlayed}\n` +
            `📊 ${bold('Win Rate:')} ${wr}%\n\n` +
            `🎮 ${P}rps • ${P}trivia • ${P}guess • ${P}ttt • ${P}math\n` +
            `🏅 ${P}rich — leaderboard`,
            threadID, messageID
        );
    }

    // ── Get name: args first, then Facebook API, then fallback ───────────────
    let name = args.join(' ').trim();
    if (!name) {
        try {
            const info = await new Promise((res, rej) => {
                api.getUserInfo(senderID, (err, data) => err ? rej(err) : res(data));
            });
            name = info?.[senderID]?.name || '';
        } catch(e) { name = ''; }
    }
    if (!name) name = `Player_${String(senderID).slice(-4)}`;

    const result = gdb.registerPlayer(senderID, name);
    if (!result.success) {
        // Edge case — already registered but isRegistered() returned false
        return api.sendMessage(
            `✅ ${bold('Rehistrado ka na!')} I-type ang ${P}register para sa stats.`,
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
        `${P}rps    — Bato-Bato-Pick   (+50 coins/win)\n` +
        `${P}trivia — Trivia Quiz       (+100 coins)\n` +
        `${P}guess  — Number Guessing   (+40-150 coins)\n` +
        `${P}ttt    — Tic Tac Toe       (+60 coins)\n` +
        `${P}math   — Math Quiz         (+30-80 coins)\n\n` +
        `🏅 ${P}rich — tingnan ang leaderboard\n` +
        `💡 ${P}register — stats mo`,
        threadID, messageID
    );
};
