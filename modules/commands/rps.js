/**
 * rps.js — Bato-Bato-Pick (with persistent game database)
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const CHOICES = {
    bato:    { emoji:'🪨', beats:'gunting', tagalog:'bato',    alt:['rock','bato','1','🪨'] },
    papel:   { emoji:'📄', beats:'bato',    tagalog:'papel',   alt:['paper','papel','2','📄'] },
    gunting: { emoji:'✂️', beats:'papel',   tagalog:'gunting', alt:['scissors','gunting','3','✂️'] },
};

const COINS = { win: 50, loss: -20, draw: 5 };

function getKey(input) {
    const s = String(input || '').toLowerCase().trim();
    for (const [key, val] of Object.entries(CHOICES)) {
        if (val.alt.includes(s)) return key;
    }
    return null;
}

module.exports.config = {
    name:            'rps',
    version:         '3.0.0',
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

    // ── Score check (no registration required) ───────────────────────────────
    if ((args[0] || '').toLowerCase() === 'score') {
        if (!gdb.isRegistered(senderID)) {
            return api.sendMessage(
                `❌ ${bold('Hindi ka pa registered!')}\n💡 ${P}register para sumali.`,
                threadID, messageID
            );
        }
        const p  = gdb.getPlayer(senderID);
        const wr = p.gamesPlayed > 0 ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0';
        return api.sendMessage(
            `╔══════════════════════╗\n║  📊 ${bold('RPS SCORECARD')}  ║\n╚══════════════════════╝\n\n` +
            `👤 ${bold(p.name)}\n💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
            `✅ W:${p.wins} ❌ L:${p.losses} 🤝 D:${p.draws}\n📊 Win Rate: ${wr}%\n\n` +
            `🏅 ${P}rich — leaderboard`,
            threadID, messageID
        );
    }

    // ── Registration check ───────────────────────────────────────────────────
    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `╔══════════════════════╗\n║  🪨 ${bold('BATO-BATO-PICK!')} ║\n╚══════════════════════╝\n\n` +
            `❌ ${bold('Kailangan mag-register muna!')}\n\n` +
            `💡 I-type: ${P}register\n✅ Libre + 100 starting coins!`,
            threadID, messageID
        );
    }

    // ── No args — show help ───────────────────────────────────────────────────
    if (!args[0]) {
        const p = gdb.getPlayer(senderID);
        return api.sendMessage(
            `╔══════════════════════╗\n║  🪨 ${bold('BATO-BATO-PICK!')} ║\n╚══════════════════════╝\n\n` +
            `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n\n` +
            `🪨 bato (1) | 📄 papel (2) | ✂️ gunting (3)\n\n` +
            `🏆 Win +${COINS.win} | ❌ Loss ${COINS.loss} | 🤝 Draw +${COINS.draw}\n\n` +
            `💡 ${P}rps bato / papel / gunting`,
            threadID, messageID
        );
    }

    // ── Play ─────────────────────────────────────────────────────────────────
    const playerKey = getKey(args[0]);
    if (!playerKey) {
        return api.sendMessage(`❎ ${bold('Mali!')} Gamitin: bato, papel, o gunting`, threadID, messageID);
    }

    const botKey = Object.keys(CHOICES)[Math.floor(Math.random() * 3)];
    const player = CHOICES[playerKey];
    const bot    = CHOICES[botKey];

    let result, resultMsg;
    if (playerKey === botKey) {
        result = 'draw'; resultMsg = `🤝 ${bold('DRAW!')}`;
    } else if (player.beats === botKey) {
        result = 'win';  resultMsg = `🎉 ${bold('NANALO KA!')}`;
    } else {
        result = 'loss'; resultMsg = `😅 ${bold('NATALO KA!')}`;
    }

    const coinChange = COINS[result];
    const { coins: newCoins } = gdb.recordGame(senderID, result, coinChange);
    const p  = gdb.getPlayer(senderID);
    const wr = p.gamesPlayed > 0 ? ((p.wins / p.gamesPlayed) * 100).toFixed(1) : '0.0';

    return api.sendMessage(
        `╔══════════════════════╗\n║  🪨 ${bold('BATO-BATO-PICK!')} ║\n╚══════════════════════╝\n\n` +
        `👤 ${bold('Ikaw:')} ${player.emoji} ${player.tagalog.toUpperCase()}\n` +
        `🤖 ${bold('Bot:')} ${bot.emoji} ${bot.tagalog.toUpperCase()}\n\n` +
        `${'─'.repeat(26)}\n` +
        `${resultMsg}\n` +
        `💰 ${coinChange > 0 ? '+' : ''}${coinChange} → ${bold(newCoins.toLocaleString())} coins\n` +
        `${'─'.repeat(26)}\n\n` +
        `📊 W${p.wins}/L${p.losses}/D${p.draws} | WR ${wr}%\n` +
        `💡 ${P}rps | ${P}rich`,
        threadID, messageID
    );
};
