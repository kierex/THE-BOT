/**
 * guess.js — Number Guessing Game (with game database)
 * Hulaan ang number! Manalo ng coins!
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const activeGames = new Map();
const MAX_ATTEMPTS = 10;

function winCoins(attempts) {
    return attempts <= 3 ? 150 : attempts <= 6 ? 80 : 40;
}

module.exports.config = {
    name:            'guess',
    version:         '2.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Number Guessing Game! Hulaan ang 1-100 at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'guess — simulan ang laro',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const P = global.config.PREFIX;

    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `❌ ${bold('Kailangan mag-register muna!')}\n💡 ${P}register para sumali sa games.`,
            threadID, messageID
        );
    }

    if (activeGames.has(`${threadID}_${senderID}`)) {
        const g = activeGames.get(`${threadID}_${senderID}`);
        return api.sendMessage(
            `⚠️ ${bold('May ongoing game ka pa!')}\n🎯 Hulaan ang numero (1-100)\n🔄 Attempts: ${g.attempts}\n💬 I-reply ang numero!`,
            threadID, messageID
        );
    }

    const p      = gdb.getPlayer(senderID);
    const secret = Math.floor(Math.random() * 100) + 1;

    api.sendMessage(
        `╔══════════════════════╗\n║  🎯 ${bold('NUMBER GUESSING')}  ║\n╚══════════════════════╝\n\n` +
        `💰 ${bold('Your coins:')} ${p.coins.toLocaleString()}\n` +
        `🏆 Win (1-3 attempts): +150 | (4-6): +80 | (7+): +40\n\n` +
        `🤖 Pumili na ako ng numero 1-100!\n` +
        `⚡ Mayroon kang hanggang ${MAX_ATTEMPTS} attempts.\n\n` +
        `💬 I-reply ang numero mo (1-100)!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            activeGames.set(`${threadID}_${senderID}`, { secret, attempts: 0 });
            global.client.handleReply.push({
                name: 'guess', messageID: info.messageID,
                author: senderID, secret, attempts: 0
            });
        },
        messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author !== senderID) return;
    const P = global.config.PREFIX;

    const guess = parseInt(body.trim());
    if (isNaN(guess) || guess < 1 || guess > 100)
        return api.sendMessage(`❎ ${bold('I-type ang numero 1-100 lang!')}`, threadID, messageID);

    handleReply.attempts++;
    activeGames.set(`${threadID}_${senderID}`, { ...handleReply });
    const remaining = MAX_ATTEMPTS - handleReply.attempts;

    if (guess === handleReply.secret) {
        activeGames.delete(`${threadID}_${senderID}`);
        const coins  = winCoins(handleReply.attempts);
        gdb.recordResult(senderID, 'win');
        const newCoins = gdb.addCoins(senderID, coins);
        const stars  = handleReply.attempts <= 3 ? '⭐⭐⭐' : handleReply.attempts <= 6 ? '⭐⭐' : '⭐';
        return api.sendMessage(
            `╔══════════════════════╗\n║  🎉 ${bold('TAMA! NANALO!')}   ║\n╚══════════════════════╝\n\n` +
            `🎯 Numero: ${handleReply.secret}\n🔄 Attempts: ${handleReply.attempts}\n${stars}\n` +
            `💰 +${coins} coins → ${bold(newCoins.toLocaleString())} coins\n\n${P}rich — leaderboard`,
            threadID, messageID
        );
    }

    if (handleReply.attempts >= MAX_ATTEMPTS) {
        activeGames.delete(`${threadID}_${senderID}`);
        gdb.recordResult(senderID, 'loss');
        gdb.addCoins(senderID, -20);
        const p = gdb.getPlayer(senderID);
        return api.sendMessage(
            `╔══════════════════════╗\n║  😅 ${bold('GAME OVER!')}      ║\n╚══════════════════════╝\n\n` +
            `🎯 Tamang numero: ${handleReply.secret}\n` +
            `💸 -20 coins → ${bold(p.coins.toLocaleString())} coins`,
            threadID, messageID
        );
    }

    const dir      = guess < handleReply.secret ? '⬆️ MATAAS pa!' : '⬇️ MABABA pa!';
    const dist     = Math.abs(guess - handleReply.secret);
    const temp     = dist <= 5 ? '🔥 Mainit!' : dist <= 15 ? '☀️ Medyo mainit' : dist <= 30 ? '🌤 Malamig' : '🥶 Malamig na malamig!';

    api.sendMessage(
        `${dir}\n${temp}\n\n🔢 Sinabi mo: ${guess}\n🔄 Attempts: ${handleReply.attempts}/${MAX_ATTEMPTS}\n💬 ${remaining} left!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            global.client.handleReply.push({
                name: 'guess', messageID: info.messageID,
                author: senderID, secret: handleReply.secret, attempts: handleReply.attempts
            });
        },
        messageID
    );
};
