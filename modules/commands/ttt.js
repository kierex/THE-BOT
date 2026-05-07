/**
 * ttt.js — Tic Tac Toe Game (laban sa bot)
 * Classic X and O game
 * TEAM STARTCOPE BETA
 */

const bold = require('../../utils/bold');

const activeGames = new Map();

const EMPTY = '⬜', X = '❌', O = '⭕';

function emptyBoard() {
    return [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
}

function renderBoard(b) {
    return (
        `${b[0]}${b[1]}${b[2]}\n` +
        `${b[3]}${b[4]}${b[5]}\n` +
        `${b[6]}${b[7]}${b[8]}`
    );
}

function checkWinner(b, mark) {
    const wins = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    return wins.some(w => w.every(i => b[i] === mark));
}

function isFull(b) { return b.every(c => c !== EMPTY); }

function botMove(b) {
    const avail = b.map((c, i) => c === EMPTY ? i : -1).filter(i => i >= 0);

    for (const i of avail) {
        const copy = [...b]; copy[i] = O;
        if (checkWinner(copy, O)) return i;
    }
    for (const i of avail) {
        const copy = [...b]; copy[i] = X;
        if (checkWinner(copy, X)) return i;
    }
    if (b[4] === EMPTY) return 4;
    const corners = [0, 2, 6, 8].filter(i => b[i] === EMPTY);
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    return avail[Math.floor(Math.random() * avail.length)];
}

module.exports.config = {
    name: 'ttt',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Tic Tac Toe game laban sa bot! Classic X at O.',
    commandCategory: 'Games',
    usages: 'ttt — simulan ang laro, pagkatapos i-reply ang bilang 1-9',
    cooldowns: 5,
};

module.exports.run = async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    if (activeGames.has(`${threadID}_${senderID}`)) {
        const g = activeGames.get(`${threadID}_${senderID}`);
        return api.sendMessage(
            `⚠️ ${bold('May ongoing game ka pa!')}\n\n${renderBoard(g.board)}\n\n💬 I-reply ang 1-9 para galaw.`,
            threadID, messageID
        );
    }

    const board = emptyBoard();
    api.sendMessage(
        `╔══════════════════╗\n` +
        `║  ❌ ${bold('TIC TAC TOE')} ⭕║\n` +
        `╚══════════════════╝\n\n` +
        `Ikaw: ${X}   Bot: ${O}\n\n` +
        `${renderBoard(['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'])}\n\n` +
        `💬 I-reply ang numero ng gusto mong sulatan (1-9)!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            activeGames.set(`${threadID}_${senderID}`, { board, messageID: info.messageID });
            global.client.handleReply.push({
                name: 'ttt',
                messageID: info.messageID,
                author: senderID,
                board
            });
        },
        messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    if (handleReply.author !== senderID) return;

    const board = handleReply.board;
    const pos = parseInt(body.trim()) - 1;

    if (isNaN(pos) || pos < 0 || pos > 8) {
        return api.sendMessage(`❎ ${bold('I-type ang numero 1-9 lang!')}`, threadID, messageID);
    }
    if (board[pos] !== EMPTY) {
        return api.sendMessage(`❎ ${bold('Napili na iyan! Pumili ng iba.')}`, threadID, messageID);
    }

    board[pos] = X;

    if (checkWinner(board, X)) {
        activeGames.delete(`${threadID}_${senderID}`);
        return api.sendMessage(
            `╔══════════════════╗\n║  🎉 ${bold('NANALO KA!')}  ║\n╚══════════════════╝\n\n${renderBoard(board)}\n\n🏆 Congrats! Ikaw ang nanalo!\n💡 Laro ulit! ${global.config.PREFIX}ttt`,
            threadID, messageID
        );
    }

    if (isFull(board)) {
        activeGames.delete(`${threadID}_${senderID}`);
        return api.sendMessage(
            `╔══════════════════╗\n║  🤝 ${bold('DRAW TAYO!')}  ║\n╚══════════════════╝\n\n${renderBoard(board)}\n\n🤝 Magaling kayo pareho!\n💡 Laro ulit! ${global.config.PREFIX}ttt`,
            threadID, messageID
        );
    }

    const botPos = botMove(board);
    board[botPos] = O;

    if (checkWinner(board, O)) {
        activeGames.delete(`${threadID}_${senderID}`);
        return api.sendMessage(
            `╔══════════════════╗\n║  😎 ${bold('BOT WINS!')}   ║\n╚══════════════════╝\n\n${renderBoard(board)}\n\n🤖 Natalo ka! Huwag suko!\n💡 Laro ulit! ${global.config.PREFIX}ttt`,
            threadID, messageID
        );
    }

    if (isFull(board)) {
        activeGames.delete(`${threadID}_${senderID}`);
        return api.sendMessage(
            `╔══════════════════╗\n║  🤝 ${bold('DRAW TAYO!')}  ║\n╚══════════════════╝\n\n${renderBoard(board)}\n\n🤝 Magaling kayo pareho!\n💡 Laro ulit! ${global.config.PREFIX}ttt`,
            threadID, messageID
        );
    }

    activeGames.set(`${threadID}_${senderID}`, { board, messageID });
    api.sendMessage(
        `${renderBoard(board)}\n\n` +
        `🤖 ${bold('Bot ay gumalaw!')} Ikaw naman.\n` +
        `💬 I-reply ang numero ng susunod mong galaw (1-9).`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            global.client.handleReply.push({
                name: 'ttt',
                messageID: info.messageID,
                author: senderID,
                board
            });
        },
        messageID
    );
};
