/**
 * rps.js — Bato-Bato-Pick (with game database)
 * Laro ng bato-bato-pick laban sa bot! Win coins!
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const CHOICES = {
    bato:    { emoji: '🪨', beats: 'gunting', tagalog: 'bato',    alt: ['rock','bato','1','🪨'] },
    papel:   { emoji: '📄', beats: 'bato',    tagalog: 'papel',   alt: ['paper','papel','2','📄'] },
    gunting: { emoji: '✂️', beats: 'papel',   tagalog: 'gunting', alt: ['scissors','gunting','3','✂️'] },
};

const WIN_COINS  = 50;
const LOSS_COINS = -20;
const DRAW_COINS = 5;

function getKey(input) {
    input = input.toLowerCase().trim();
    for (const [key, val] of Object.entries(CHOICES)) {
        if (val.alt.includes(input)) return key;
    }
    return null;
}

module.exports.config = {
    name:            'rps',
    version:         '2.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Bato-Bato-Pick laban sa bot! Mag-register at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'rps [bato/papel/gunting] | rps score',
    cooldowns:       3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const P = global.config.PREFIX;

    if (args[0]?.toLowerCase() === 'score') {
        if (!gdb.isRegistered(senderID)) {
            return api.sendMessage(
                `❌ ${bold('Hindi ka pa registered!')}\n` +
                `💡 ${P}register para makita ang score.`,
                threadID, messageID
            );
        }
        const p  = gdb.getPlayer(senderID);
        const wr = p.gamesPlayed > 0 ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0';
        return api.sendMessage(
            `╔══════════════════════╗\n║  📊 ${bold('RPS SCORECARD')}  ║\n╚══════════════════════╝\n\n` +
            `👤 ${bold(p.name)}\n` +
            `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
            `✅ ${bold('Wins:')} ${p.wins} | ❌ ${bold('Losses:')} ${p.losses} | 🤝 ${bold('Draws:')} ${p.draws}\n` +
            `📊 ${bold('Win Rate:')} ${wr}%\n\n` +
            `🏅 ${P}rich — leaderboard`,
            threadID, messageID
        );
    }

    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `╔══════════════════════╗\n║  🪨 ${bold('BATO-BATO-PICK!')} ║\n╚══════════════════════╝\n\n` +
            `❌ ${bold('Kailangan mag-register muna!')}\n\n` +
            `💡 I-type: ${P}register\n` +
            `✅ Makakakuha ka ng 100 starting coins!\n` +
            `🎮 Pagkatapos ay pwede ka nang maglaro!`,
            threadID, messageID
        );
    }

    if (!args[0]) {
        const p = gdb.getPlayer(senderID);
        return api.sendMessage(
            `╔══════════════════════╗\n║  🪨 ${bold('BATO-BATO-PICK!')} ║\n╚══════════════════════╝\n\n` +
            `💰 ${bold('Your coins:')} ${p.coins.toLocaleString()}\n\n` +
            `🪨 bato (1)  📄 papel (2)  ✂️ gunting (3)\n\n` +
            `🏆 Win: +${WIN_COINS} coins | ❌ Loss: ${LOSS_COINS} coins | 🤝 Draw: +${DRAW_COINS} coins\n\n` +
            `💡 ${P}rps bato / papel / gunting`,
            threadID, messageID
        );
    }

    const playerKey = getKey(args[0]);
    if (!playerKey) {
        return api.sendMessage(`❎ ${bold('Mali!')} Gamitin: bato, papel, o gunting`, threadID, messageID);
    }

    const botKey = Object.keys(CHOICES)[Math.floor(Math.random() * 3)];
    const player = CHOICES[playerKey];
    const bot    = CHOICES[botKey];

    let result, resultMsg, coinChange;
    if (playerKey === botKey) {
        result = 'draw'; resultMsg = `🤝 ${bold('DRAW! Pareho kayo!')}`; coinChange = DRAW_COINS;
    } else if (player.beats === botKey) {
        result = 'win';  resultMsg = `🎉 ${bold('NANALO KA!')}`; coinChange = WIN_COINS;
    } else {
        result = 'loss'; resultMsg = `😅 ${bold('NATALO KA! Bot wins!')}`; coinChange = LOSS_COINS;
    }

    gdb.recordResult(senderID, result);
    const newCoins = gdb.addCoins(senderID, coinChange);
    const p        = gdb.getPlayer(senderID);
    const wr       = p.gamesPlayed > 0 ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0';

    return api.sendMessage(
        `╔══════════════════════╗\n║  🪨 ${bold('BATO-BATO-PICK!')} ║\n╚══════════════════════╝\n\n` +
        `👤 ${bold('Ikaw:')} ${player.emoji} ${player.tagalog.toUpperCase()}\n` +
        `🤖 ${bold('Bot:')} ${bot.emoji} ${bot.tagalog.toUpperCase()}\n\n` +
        `${'─'.repeat(28)}\n` +
        `${resultMsg}\n` +
        `💰 ${coinChange > 0 ? '+' : ''}${coinChange} coins → ${bold(newCoins.toLocaleString())} coins\n` +
        `${'─'.repeat(28)}\n\n` +
        `📊 W${p.wins} / L${p.losses} / D${p.draws} | WR ${wr}%\n` +
        `💡 ${P}rps [bato/papel/gunting] | ${P}rich`,
        threadID, messageID
    );
};
