/**
 * guess.js — Number Guessing Game
 * Hulaan ang number na pinili ng bot!
 * TEAM STARTCOPE BETA
 */

const bold = require('../../utils/bold');

const activeGames = new Map();

module.exports.config = {
    name: 'guess',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Number Guessing Game! Hulaan ang numero na pinili ng bot (1-100)',
    commandCategory: 'Games',
    usages: 'guess — simulan ang laro',
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (activeGames.has(`${threadID}_${senderID}`)) {
        const g = activeGames.get(`${threadID}_${senderID}`);
        return api.sendMessage(
            `⚠️ ${bold('May ongoing game ka pa!')}\n\n` +
            `🎯 Hulaan pa rin ang numero (1-100)\n` +
            `🔄 Attempts: ${g.attempts}\n` +
            `💬 I-reply ang numero mo!`,
            threadID, messageID
        );
    }

    const secret = Math.floor(Math.random() * 100) + 1;
    api.sendMessage(
        `╔══════════════════════╗\n` +
        `║  🎯 ${bold('NUMBER GUESSING')}  ║\n` +
        `╚══════════════════════╝\n\n` +
        `🤖 Pumili na ako ng numero mula 1-100!\n` +
        `🎯 Subukan mong hulaan ito!\n` +
        `⚡ Mayroon kang hanggang 10 attempts.\n\n` +
        `💬 I-reply ang numero mo (1-100)!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            activeGames.set(`${threadID}_${senderID}`, { secret, attempts: 0, messageID: info.messageID });
            global.client.handleReply.push({
                name: 'guess',
                messageID: info.messageID,
                author: senderID,
                secret,
                attempts: 0
            });
        },
        messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author !== senderID) return;

    const guess = parseInt(body.trim());
    if (isNaN(guess) || guess < 1 || guess > 100) {
        return api.sendMessage(`❎ ${bold('I-type lang ang numero mula 1-100!')}`, threadID, messageID);
    }

    handleReply.attempts++;
    activeGames.set(`${threadID}_${senderID}`, { ...handleReply });
    const maxAttempts = 10;
    const remaining = maxAttempts - handleReply.attempts;

    if (guess === handleReply.secret) {
        activeGames.delete(`${threadID}_${senderID}`);
        const stars = handleReply.attempts <= 3 ? '⭐⭐⭐' : handleReply.attempts <= 6 ? '⭐⭐' : '⭐';
        return api.sendMessage(
            `╔══════════════════════╗\n║  🎉 ${bold('TAMA! NANALO KA!')} ║\n╚══════════════════════╝\n\n` +
            `🎯 ${bold('Numero:')} ${handleReply.secret}\n` +
            `🔄 ${bold('Attempts:')} ${handleReply.attempts}\n` +
            `${stars} ${bold('Rating!')}\n\n` +
            `💡 Laro ulit! ${global.config.PREFIX}guess`,
            threadID, messageID
        );
    }

    if (handleReply.attempts >= maxAttempts) {
        activeGames.delete(`${threadID}_${senderID}`);
        return api.sendMessage(
            `╔══════════════════════╗\n║  😅 ${bold('GAME OVER!')}      ║\n╚══════════════════════╝\n\n` +
            `🎯 ${bold('Tamang numero:')} ${handleReply.secret}\n` +
            `😔 Naubos na ang iyong 10 attempts!\n\n` +
            `💡 Laro ulit! ${global.config.PREFIX}guess`,
            threadID, messageID
        );
    }

    const direction = guess < handleReply.secret ? '⬆️ MATAAS pa!' : '⬇️ MABABA pa!';
    const distance = Math.abs(guess - handleReply.secret);
    const temp = distance <= 5 ? '🔥 Mainit!' : distance <= 15 ? '☀️ Medyo mainit' : distance <= 30 ? '🌤 Malamig' : '🥶 Malamig na malamig!';

    return api.sendMessage(
        `${direction}\n${temp}\n\n` +
        `🔢 ${bold('Sinabi mo:')} ${guess}\n` +
        `🔄 ${bold('Attempts:')} ${handleReply.attempts} / ${maxAttempts}\n` +
        `💬 Subukan ulit — ${remaining} attempts pa ang natira!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            global.client.handleReply.push({
                name: 'guess',
                messageID: info.messageID,
                author: senderID,
                secret: handleReply.secret,
                attempts: handleReply.attempts
            });
        },
        messageID
    );
};
