/**
 * math.js — Math Quiz Game
 * Sumagot ng math questions at manalo ng puntos
 * TEAM STARTCOPE BETA
 */

const bold = require('../../utils/bold');

const activeGames = new Map();

function generateQuestion(level) {
    let a, b, op, answer, question;
    const ops = level === 'easy' ? ['+', '-'] : level === 'medium' ? ['+', '-', '*'] : ['+', '-', '*', '/'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (level === 'easy') {
        a = Math.floor(Math.random() * 20) + 1;
        b = Math.floor(Math.random() * 20) + 1;
    } else if (level === 'medium') {
        a = Math.floor(Math.random() * 50) + 10;
        b = Math.floor(Math.random() * 30) + 5;
    } else {
        a = Math.floor(Math.random() * 100) + 20;
        b = Math.floor(Math.random() * 50) + 10;
    }
    if (op === '-' && b > a) [a, b] = [b, a];
    if (op === '/') {
        b = Math.floor(Math.random() * 9) + 2;
        a = b * (Math.floor(Math.random() * 10) + 2);
    }
    switch (op) {
        case '+': answer = a + b; question = `${a} + ${b}`; break;
        case '-': answer = a - b; question = `${a} - ${b}`; break;
        case '*': answer = a * b; question = `${a} × ${b}`; break;
        case '/': answer = a / b; question = `${a} ÷ ${b}`; break;
    }
    return { question, answer };
}

module.exports.config = {
    name: 'math',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Math Quiz Game — sagutin ang math questions at manalo ng puntos!',
    commandCategory: 'Games',
    usages: 'math [easy/medium/hard]',
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const level = ['easy', 'medium', 'hard'].includes(args[0]?.toLowerCase()) ? args[0].toLowerCase() : 'medium';

    if (activeGames.has(`${threadID}_${senderID}`)) {
        return api.sendMessage(
            `⚠️ ${bold('May ongoing game ka pa!')} Sagutin mo muna ang nakaraang tanong.`,
            threadID, messageID
        );
    }

    const { question, answer } = generateQuestion(level);
    const timeLimit = level === 'easy' ? 15 : level === 'medium' ? 20 : 30;

    const levelEmoji = { easy: '🟢', medium: '🟡', hard: '🔴' };
    api.sendMessage(
        `╔══════════════════╗\n` +
        `║  🔢 ${bold('MATH GAME')}      ║\n` +
        `╚══════════════════╝\n\n` +
        `${levelEmoji[level]} ${bold('Level:')} ${level.toUpperCase()}\n` +
        `⏰ ${bold('Time:')} ${timeLimit} segundo\n\n` +
        `🧮 ${bold('Tanong:')} Magkano ang\n` +
        `   ${bold(question)} = ?\n\n` +
        `💬 I-reply ang iyong sagot!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            const timeout = setTimeout(() => {
                activeGames.delete(`${threadID}_${senderID}`);
                api.sendMessage(
                    `⏰ ${bold('Time\'s up!')}\n\n` +
                    `✅ ${bold('Tamang sagot:')} ${answer}\n` +
                    `💡 Subukan ulit! ${global.config.PREFIX}math ${level}`,
                    threadID
                );
            }, timeLimit * 1000);

            activeGames.set(`${threadID}_${senderID}`, { answer, messageID: info.messageID, timeout, level });
            global.client.handleReply.push({
                name: 'math',
                messageID: info.messageID,
                author: senderID,
                answer,
                level,
                timeoutRef: timeout
            });
        },
        messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author !== senderID) return;

    clearTimeout(handleReply.timeoutRef);
    activeGames.delete(`${threadID}_${senderID}`);

    const userAnswer = parseFloat(body.trim());
    const correct = handleReply.answer;
    const isCorrect = !isNaN(userAnswer) && Math.abs(userAnswer - correct) < 0.01;

    if (isCorrect) {
        return api.sendMessage(
            `🎉 ${bold('TAMA! GALING MO!')}\n\n` +
            `✅ ${bold('Sagot:')} ${correct}\n` +
            `🏆 Congratulations!\n\n` +
            `💡 Subukan ulit! ${global.config.PREFIX}math ${handleReply.level}`,
            threadID, messageID
        );
    } else {
        return api.sendMessage(
            `❌ ${bold('Mali ang sagot!')}\n\n` +
            `✅ ${bold('Tamang sagot:')} ${correct}\n` +
            `📝 ${bold('Sinabi mo:')} ${body.trim()}\n\n` +
            `💡 Subukan ulit! ${global.config.PREFIX}math ${handleReply.level}`,
            threadID, messageID
        );
    }
};
