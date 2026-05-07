/**
 * rps.js — Rock Paper Scissors / Bato Bato Pick Game
 * Laro ng bato-bato-pick laban sa bot!
 * TEAM STARTCOPE BETA
 */

const bold = require('../../utils/bold');

const CHOICES = {
    bato: { emoji: '🪨', beats: 'gunting', tagalog: 'bato', alt: ['rock', 'bato', '1', '🪨'] },
    papel: { emoji: '📄', beats: 'bato', tagalog: 'papel', alt: ['paper', 'papel', '2', '📄'] },
    gunting: { emoji: '✂️', beats: 'papel', tagalog: 'gunting', alt: ['scissors', 'gunting', '3', '✂️'] },
};

const SCORES = new Map();

function getKey(input) {
    input = input.toLowerCase().trim();
    for (const [key, val] of Object.entries(CHOICES)) {
        if (val.alt.includes(input)) return key;
    }
    return null;
}

function getScore(uid) {
    return SCORES.get(uid) || { wins: 0, losses: 0, draws: 0 };
}

module.exports.config = {
    name: 'rps',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Bato-Bato-Pick laban sa bot! Rock Paper Scissors game.',
    commandCategory: 'Games',
    usages: 'rps [bato/papel/gunting] | rps score',
    cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (!args[0]) {
        return api.sendMessage(
            `╔══════════════════════╗\n` +
            `║  ✂️ ${bold('BATO-BATO-PICK!')} ║\n` +
            `╚══════════════════════╝\n\n` +
            `🪨 ${bold('1 / bato')} — Bato\n` +
            `📄 ${bold('2 / papel')} — Papel\n` +
            `✂️ ${bold('3 / gunting')} — Gunting\n\n` +
            `📌 ${bold('Paano maglaro:')}\n` +
            `${global.config.PREFIX}rps bato\n` +
            `${global.config.PREFIX}rps papel\n` +
            `${global.config.PREFIX}rps gunting\n\n` +
            `📊 ${global.config.PREFIX}rps score — tingnan ang score`,
            threadID, messageID
        );
    }

    if (args[0].toLowerCase() === 'score') {
        const s = getScore(senderID);
        const total = s.wins + s.losses + s.draws;
        const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : '0.0';
        return api.sendMessage(
            `╔══════════════════════╗\n` +
            `║  📊 ${bold('RPS SCORECARD')}  ║\n` +
            `╚══════════════════════╝\n\n` +
            `✅ ${bold('Wins:')} ${s.wins}\n` +
            `❌ ${bold('Losses:')} ${s.losses}\n` +
            `🤝 ${bold('Draws:')} ${s.draws}\n` +
            `📊 ${bold('Win Rate:')} ${winRate}%\n\n` +
            `💡 ${global.config.PREFIX}rps [bato/papel/gunting] para maglaro!`,
            threadID, messageID
        );
    }

    const playerKey = getKey(args[0]);
    if (!playerKey) {
        return api.sendMessage(
            `❎ ${bold('Mali ang input!')}\n\n` +
            `✅ Gamitin: bato, papel, o gunting\n` +
            `💡 Example: ${global.config.PREFIX}rps bato`,
            threadID, messageID
        );
    }

    const botKeys = Object.keys(CHOICES);
    const botKey = botKeys[Math.floor(Math.random() * botKeys.length)];
    const player = CHOICES[playerKey];
    const bot = CHOICES[botKey];
    const score = getScore(senderID);

    let result, resultMsg;
    if (playerKey === botKey) {
        result = 'draw';
        score.draws++;
        resultMsg = `🤝 ${bold('DRAW! Pareho kayo!')}`;
    } else if (player.beats === botKey) {
        result = 'win';
        score.wins++;
        resultMsg = `🎉 ${bold('NANALO KA! Ang galing mo!')}`;
    } else {
        result = 'loss';
        score.losses++;
        resultMsg = `😅 ${bold('NATALO KA! Bot wins!')}`;
    }

    SCORES.set(senderID, score);

    return api.sendMessage(
        `╔══════════════════════╗\n` +
        `║  ✂️ ${bold('BATO-BATO-PICK!')} ║\n` +
        `╚══════════════════════╝\n\n` +
        `👤 ${bold('Ikaw:')} ${player.emoji} ${player.tagalog.toUpperCase()}\n` +
        `🤖 ${bold('Bot:')} ${bot.emoji} ${bot.tagalog.toUpperCase()}\n\n` +
        `${'─'.repeat(28)}\n` +
        `${resultMsg}\n` +
        `${'─'.repeat(28)}\n\n` +
        `📊 ${bold('Score:')} W${score.wins} / L${score.losses} / D${score.draws}\n` +
        `💡 Laro ulit! ${global.config.PREFIX}rps [bato/papel/gunting]`,
        threadID, messageID
    );
};
