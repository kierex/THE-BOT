/**
 * ttt.js — Tic Tac Toe (with game database)
 * Classic X at O laban sa bot! Manalo ng coins!
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const activeGames = new Map();
const EMPTY = '⬜', X = '❌', O = '⭕';
const WIN_COINS  = 60;
const LOSS_COINS = -20;
const DRAW_COINS = 10;

function emptyBoard() { return [EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY]; }
function renderBoard(b) { return `${b[0]}${b[1]}${b[2]}\n${b[3]}${b[4]}${b[5]}\n${b[6]}${b[7]}${b[8]}`; }
function checkWinner(b, mark) {
    return [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
        .some(w => w.every(i => b[i] === mark));
}
function isFull(b) { return b.every(c => c !== EMPTY); }
function botMove(b) {
    const avail = b.map((c,i) => c===EMPTY?i:-1).filter(i=>i>=0);
    for (const i of avail) { const c=[...b]; c[i]=O; if(checkWinner(c,O)) return i; }
    for (const i of avail) { const c=[...b]; c[i]=X; if(checkWinner(c,X)) return i; }
    if (b[4]===EMPTY) return 4;
    const corners=[0,2,6,8].filter(i=>b[i]===EMPTY);
    if (corners.length) return corners[Math.floor(Math.random()*corners.length)];
    return avail[Math.floor(Math.random()*avail.length)];
}

module.exports.config = {
    name:            'ttt',
    version:         '2.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Tic Tac Toe laban sa bot! Manalo ng coins!',
    commandCategory: 'Games',
    usages:          'ttt — simulan, pagkatapos i-reply ang 1-9',
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
            `⚠️ ${bold('May game ka pa!')}\n\n${renderBoard(g.board)}\n\n💬 I-reply ang 1-9.`,
            threadID, messageID
        );
    }

    const p     = gdb.getPlayer(senderID);
    const board = emptyBoard();
    api.sendMessage(
        `╔══════════════════╗\n║  ❌ ${bold('TIC TAC TOE')} ⭕║\n╚══════════════════╝\n\n` +
        `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
        `🏆 Win: +${WIN_COINS} | ❌ Loss: ${LOSS_COINS} | 🤝 Draw: +${DRAW_COINS}\n\n` +
        `Ikaw: ${X}   Bot: ${O}\n\n` +
        `${renderBoard(['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'])}\n\n` +
        `💬 I-reply ang numero (1-9)!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            activeGames.set(`${threadID}_${senderID}`, { board });
            global.client.handleReply.push({ name:'ttt', messageID:info.messageID, author:senderID, board });
        },
        messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author !== senderID) return;
    const P     = global.config.PREFIX;
    const board = handleReply.board;
    const pos   = parseInt(body.trim()) - 1;

    if (isNaN(pos) || pos < 0 || pos > 8)
        return api.sendMessage(`❎ ${bold('I-type ang 1-9 lang!')}`, threadID, messageID);
    if (board[pos] !== EMPTY)
        return api.sendMessage(`❎ ${bold('Napili na iyan!')}`, threadID, messageID);

    board[pos] = X;

    if (checkWinner(board, X)) {
        activeGames.delete(`${threadID}_${senderID}`);
        gdb.recordResult(senderID, 'win');
        const newCoins = gdb.addCoins(senderID, WIN_COINS);
        return api.sendMessage(
            `╔══════════════════╗\n║  🎉 ${bold('NANALO KA!')}  ║\n╚══════════════════╝\n\n` +
            `${renderBoard(board)}\n\n💰 +${WIN_COINS} coins → ${bold(newCoins.toLocaleString())}\n${P}rich`,
            threadID, messageID
        );
    }
    if (isFull(board)) {
        activeGames.delete(`${threadID}_${senderID}`);
        gdb.recordResult(senderID, 'draw');
        const newCoins = gdb.addCoins(senderID, DRAW_COINS);
        return api.sendMessage(
            `╔══════════════════╗\n║  🤝 ${bold('DRAW!')}       ║\n╚══════════════════╝\n\n` +
            `${renderBoard(board)}\n\n💰 +${DRAW_COINS} coins → ${bold(newCoins.toLocaleString())}`,
            threadID, messageID
        );
    }

    const botPos = botMove(board);
    board[botPos] = O;

    if (checkWinner(board, O)) {
        activeGames.delete(`${threadID}_${senderID}`);
        gdb.recordResult(senderID, 'loss');
        const newCoins = gdb.addCoins(senderID, LOSS_COINS);
        return api.sendMessage(
            `╔══════════════════╗\n║  😎 ${bold('BOT WINS!')}   ║\n╚══════════════════╝\n\n` +
            `${renderBoard(board)}\n\n💸 ${LOSS_COINS} coins → ${bold(newCoins.toLocaleString())}`,
            threadID, messageID
        );
    }
    if (isFull(board)) {
        activeGames.delete(`${threadID}_${senderID}`);
        gdb.recordResult(senderID, 'draw');
        const newCoins = gdb.addCoins(senderID, DRAW_COINS);
        return api.sendMessage(
            `🤝 ${bold('DRAW!')}\n\n${renderBoard(board)}\n\n💰 +${DRAW_COINS} coins → ${bold(newCoins.toLocaleString())}`,
            threadID, messageID
        );
    }

    activeGames.set(`${threadID}_${senderID}`, { board });
    api.sendMessage(
        `${renderBoard(board)}\n\n🤖 ${bold('Bot ay gumalaw!')} Ikaw naman.\n💬 I-reply ang 1-9.`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            global.client.handleReply.push({ name:'ttt', messageID:info.messageID, author:senderID, board });
        },
        messageID
    );
};
