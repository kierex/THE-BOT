/**
 * guess.js — Number Guessing Game (with persistent game database)
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const activeGames  = new Map();
const MAX_ATTEMPTS = 10;

function winCoins(attempts) {
    return attempts <= 3 ? 150 : attempts <= 6 ? 80 : 40;
}

module.exports.config = {
    name:            'guess',
    version:         '3.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Number Guessing Game — hulaan ang 1-100 at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'guess — simulan ang laro',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const P = global.config.PREFIX;

    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `❌ ${bold('Kailangan mag-register muna!')}\n💡 ${P}register para sumali.`,
            threadID, messageID
        );
    }

    const gameKey = `${threadID}_${senderID}`;

    if (activeGames.has(gameKey)) {
        const g = activeGames.get(gameKey);
        return api.sendMessage(
            `⚠️ ${bold('May game ka pa!')}\n🎯 Hulaan ang numero (1-100)\n🔄 Attempts: ${g.attempts}\n💬 I-reply ang numero!`,
            threadID, messageID
        );
    }

    const p      = gdb.getPlayer(senderID);
    const secret = Math.floor(Math.random() * 100) + 1;

    api.sendMessage(
        `╔══════════════════════╗\n║  🎯 ${bold('NUMBER GUESSING')}  ║\n╚══════════════════════╝\n\n` +
        `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
        `🏆 Win (≤3): +150 | (≤6): +80 | (≤10): +40\n❌ Lose: -20\n\n` +
        `🤖 Pumili na ako ng numero 1-100!\n` +
        `⚡ Max ${MAX_ATTEMPTS} attempts.\n\n` +
        `💬 I-reply ang numero mo (1-100)!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            activeGames.set(gameKey, { secret, attempts: 0 });
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

    const P     = global.config.PREFIX;
    const guess = parseInt(String(body || '').trim());

    if (isNaN(guess) || guess < 1 || guess > 100) {
        return api.sendMessage(`❎ ${bold('I-type ang numero 1-100 lang!')}`, threadID, messageID);
    }

    handleReply.attempts++;
    const gameKey  = `${threadID}_${senderID}`;
    const remaining = MAX_ATTEMPTS - handleReply.attempts;

    if (guess === handleReply.secret) {
        activeGames.delete(gameKey);
        const coins = winCoins(handleReply.attempts);
        const { coins: nc } = gdb.recordGame(senderID, 'win', coins);
        const stars = handleReply.attempts <= 3 ? '⭐⭐⭐' : handleReply.attempts <= 6 ? '⭐⭐' : '⭐';
        return api.sendMessage(
            `╔══════════════════════╗\n║  🎉 ${bold('TAMA! NANALO!')}   ║\n╚══════════════════════╝\n\n` +
            `🎯 Numero: ${handleReply.secret}\n🔄 Attempts: ${handleReply.attempts}\n${stars}\n` +
            `💰 +${coins} coins → ${bold(nc.toLocaleString())} coins\n\n${P}rich`,
            threadID, messageID
        );
    }

    if (handleReply.attempts >= MAX_ATTEMPTS) {
        activeGames.delete(gameKey);
        const { coins: nc } = gdb.recordGame(senderID, 'loss', -20);
        return api.sendMessage(
            `╔══════════════════════╗\n║  😅 ${bold('GAME OVER!')}      ║\n╚══════════════════════╝\n\n` +
            `🎯 Tamang numero: ${handleReply.secret}\n💸 -20 coins → ${bold(nc.toLocaleString())} coins`,
            threadID, messageID
        );
    }

    activeGames.set(gameKey, { ...handleReply });

    const dir  = guess < handleReply.secret ? '⬆️ MATAAS pa!' : '⬇️ MABABA pa!';
    const dist = Math.abs(guess - handleReply.secret);
    const temp = dist <= 5 ? '🔥 Mainit!' : dist <= 15 ? '☀️ Medyo mainit' : dist <= 30 ? '🌤 Malamig' : '🥶 Malamig na malamig!';

    api.sendMessage(
        `${dir}\n${temp}\n\n🔢 Sinabi mo: ${guess}\n🔄 ${handleReply.attempts}/${MAX_ATTEMPTS} | ${remaining} na lang!`,
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
