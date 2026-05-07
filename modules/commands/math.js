/**
 * math.js — Math Quiz Game (with persistent game database)
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const activeGames = new Map();
const WIN_COINS   = { easy: 30, medium: 50, hard: 80 };
const LOSS_COINS  = -10;

function generateQuestion(level) {
    let a, b, op, answer, question;
    const ops = level==='easy' ? ['+','-'] : level==='medium' ? ['+','-','*'] : ['+','-','*','/'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if      (level === 'easy')   { a=Math.floor(Math.random()*20)+1;  b=Math.floor(Math.random()*20)+1; }
    else if (level === 'medium') { a=Math.floor(Math.random()*50)+10; b=Math.floor(Math.random()*30)+5; }
    else                         { a=Math.floor(Math.random()*100)+20;b=Math.floor(Math.random()*50)+10;}
    if (op==='-' && b>a) [a,b]=[b,a];
    if (op==='/') { b=Math.floor(Math.random()*9)+2; a=b*(Math.floor(Math.random()*10)+2); }
    switch(op) {
        case '+': answer=a+b; question=`${a} + ${b}`; break;
        case '-': answer=a-b; question=`${a} - ${b}`; break;
        case '*': answer=a*b; question=`${a} × ${b}`; break;
        case '/': answer=a/b; question=`${a} ÷ ${b}`; break;
    }
    return { question, answer };
}

module.exports.config = {
    name:            'math',
    version:         '3.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Math Quiz — sagutin at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'math [easy/medium/hard]',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const P     = global.config.PREFIX;
    const level = ['easy','medium','hard'].includes((args[0]||'').toLowerCase())
                  ? args[0].toLowerCase() : 'medium';
    const gameKey = `${threadID}_${senderID}`;

    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `❌ ${bold('Kailangan mag-register muna!')}\n💡 ${P}register para sumali.`,
            threadID, messageID
        );
    }

    if (activeGames.has(gameKey)) {
        return api.sendMessage(`⚠️ ${bold('May game ka pa!')} Sagutin muna.`, threadID, messageID);
    }

    const p              = gdb.getPlayer(senderID);
    const { question, answer } = generateQuestion(level);
    const tl             = level==='easy' ? 15 : level==='medium' ? 20 : 30;
    const win            = WIN_COINS[level];
    const lvlE           = { easy:'🟢', medium:'🟡', hard:'🔴' };

    api.sendMessage(
        `╔══════════════════╗\n║  🔢 ${bold('MATH GAME')}      ║\n╚══════════════════╝\n\n` +
        `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
        `${lvlE[level]} ${bold('Level:')} ${level.toUpperCase()}\n` +
        `🏆 Tama: +${win} | ❌ Mali: ${LOSS_COINS}\n\n` +
        `⏰ ${bold('Time:')} ${tl} segundo\n\n` +
        `🧮 ${bold(question)} = ?\n\n` +
        `💬 I-reply ang sagot!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            const timeout = setTimeout(() => {
                activeGames.delete(gameKey);
                const { coins: nc } = gdb.recordGame(senderID, 'loss', LOSS_COINS);
                api.sendMessage(
                    `⏰ ${bold("Time's up!")}\n✅ ${bold('Tamang sagot:')} ${answer}\n` +
                    `💸 ${LOSS_COINS} coins → ${bold(nc.toLocaleString())} coins`,
                    threadID
                );
            }, tl * 1000);

            activeGames.set(gameKey, { answer, level, timeout });
            global.client.handleReply.push({
                name:'math', messageID:info.messageID,
                author:senderID, answer, level, win, timeoutRef:timeout
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

    const userAns   = parseFloat(String(body || '').trim());
    const isCorrect = !isNaN(userAns) && Math.abs(userAns - handleReply.answer) < 0.01;

    if (isCorrect) {
        const { coins: nc } = gdb.recordGame(senderID, 'win', handleReply.win);
        return api.sendMessage(
            `🎉 ${bold('TAMA! GALING MO!')}\n✅ ${bold('Sagot:')} ${handleReply.answer}\n` +
            `💰 +${handleReply.win} coins → ${bold(nc.toLocaleString())} coins`,
            threadID, messageID
        );
    } else {
        const { coins: nc } = gdb.recordGame(senderID, 'loss', LOSS_COINS);
        return api.sendMessage(
            `❌ ${bold('Mali!')}\n✅ ${bold('Tamang sagot:')} ${handleReply.answer}\n` +
            `💸 ${LOSS_COINS} coins → ${bold(nc.toLocaleString())} coins`,
            threadID, messageID
        );
    }
};
