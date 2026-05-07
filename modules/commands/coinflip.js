/**
 * coinflip.js — Coin flip betting game
 * !coinflip [heads/tails] [bet] — bet against the bot
 * !coinflip challenge @user [bet] — 1v1 coinflip battle
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const activeChallenges = new Map(); // threadID_challengerID → challenge data

function hpBar(val, max, len = 12) {
    const filled = Math.round((val / max) * len);
    return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, len - filled));
}

module.exports.config = {
    name:            'coinflip',
    version:         '2.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Coinflip betting — laban sa bot o sa ibang player!',
    commandCategory: 'Games',
    usages:          'coinflip [h/t] [bet] | coinflip challenge @user [bet]',
    cooldowns:       5,
};

function flip() { return Math.random() < 0.5 ? 'heads' : 'tails'; }
function coinEmoji(r) { return r === 'heads' ? '👑 HEADS' : '🦅 TAILS'; }
function normalizeChoice(s) {
    const v = String(s || '').toLowerCase().trim();
    if (['h','heads','ulo','crown'].includes(v))  return 'heads';
    if (['t','tails','buntot','eagle'].includes(v)) return 'tails';
    return null;
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions } = event;
    const P = global.config.PREFIX;

    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `❌ ${bold('Mag-register muna!')}\n💡 ${P}register — libre at may 100 starting coins!`,
            threadID, messageID
        );
    }

    const player = gdb.getPlayer(senderID);

    // ── CHALLENGE MODE ────────────────────────────────────────────────────────
    if ((args[0] || '').toLowerCase() === 'challenge') {
        const mentionIDs = Object.keys(mentions || {});
        if (!mentionIDs.length) {
            return api.sendMessage(
                `❎ ${bold('Format:')} ${P}coinflip challenge @user [bet]\n` +
                `📌 Example: ${P}coinflip challenge @Juan 50`,
                threadID, messageID
            );
        }
        const targetID = mentionIDs[0];
        if (String(targetID) === String(senderID)) {
            return api.sendMessage(`❎ ${bold('Hindi mo ma-challenge ang sarili mo!')}`, threadID, messageID);
        }
        if (!gdb.isRegistered(targetID)) {
            return api.sendMessage(
                `❎ ${bold('Ang kausap mo ay hindi pa registered!')}\n💡 ${P}register para maglaro.`,
                threadID, messageID
            );
        }

        const betAmount = parseInt(args.slice(2).find(a => !isNaN(parseInt(a)))) || 50;
        if (isNaN(betAmount) || betAmount < 10) {
            return api.sendMessage(`❎ ${bold('Minimum bet: 10 coins!')}`, threadID, messageID);
        }
        if (betAmount > player.coins) {
            return api.sendMessage(
                `❎ ${bold('Kulang ang coins mo!')}\n💰 May ${player.coins} ka lang, bet mo ay ${betAmount}.`,
                threadID, messageID
            );
        }

        const target = gdb.getPlayer(targetID);
        if (betAmount > target.coins) {
            return api.sendMessage(
                `❎ ${bold('Kulang ang coins ng kausap mo!')}\n💰 May ${target.coins} coins lang siya.`,
                threadID, messageID
            );
        }

        const challengeKey = `${threadID}_${senderID}`;
        activeChallenges.set(challengeKey, {
            challengerID: senderID, challengerName: player.name,
            targetID, targetName: target.name, bet: betAmount,
            expires: Date.now() + 60000
        });

        api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  🪙 ${bold('COINFLIP CHALLENGE!')}    ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `⚔️ ${bold(player.name)} challenges ${bold(target.name)}!\n` +
            `💰 ${bold('Bet:')} ${betAmount} coins each\n` +
            `🏆 Winner gets: ${betAmount * 2} coins!\n\n` +
            `${mentions[targetID] || target.name}, i-reply ang:\n` +
            `✅ "accept" para sumali\n` +
            `❌ "decline" para tanggihan\n\n` +
            `⏰ 60 segundo para sumagot!`,
            threadID,
            (err, info) => {
                if (err || !info) return;
                global.client.handleReply.push({
                    name: 'coinflip',
                    messageID: info.messageID,
                    type: 'challenge_pending',
                    challengeKey
                });
            },
            messageID
        );
        return;
    }

    // ── VS BOT MODE ───────────────────────────────────────────────────────────
    const choice    = normalizeChoice(args[0]);
    const betAmount = parseInt(args[1]) || parseInt(args[0]) || 50;

    if (!choice && isNaN(parseInt(args[0]))) {
        return api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  🪙 ${bold('COINFLIP')}               ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `💰 ${bold('Coins:')} ${player.coins.toLocaleString()}\n\n` +
            `📋 ${bold('Commands:')}\n` +
            `• ${P}coinflip [h/t] [bet] — laban sa bot\n` +
            `• ${P}coinflip challenge @user [bet] — 1v1\n\n` +
            `💡 ${bold('Halimbawa:')}\n` +
            `${P}coinflip h 100 — bet 100 sa heads\n` +
            `${P}coinflip t 50  — bet 50 sa tails\n\n` +
            `🏆 Win = double your bet! (minus 5% fee)\n` +
            `❌ Lose = mawala ang bet mo`,
            threadID, messageID
        );
    }

    const actualBet = Math.abs(betAmount) || 50;
    if (actualBet < 5)  return api.sendMessage(`❎ ${bold('Minimum bet: 5 coins!')}`, threadID, messageID);
    if (actualBet > player.coins) {
        return api.sendMessage(
            `❎ ${bold('Kulang ang coins mo!')}\n💰 May ${player.coins.toLocaleString()} ka lang.`,
            threadID, messageID
        );
    }

    const finalChoice = choice || 'heads';
    const result      = flip();
    const won         = finalChoice === result;
    const winnings    = won ? Math.floor(actualBet * 0.95) : -actualBet;

    const { coins: newCoins } = gdb.recordGame(senderID, won ? 'win' : 'loss', winnings);

    const ANIM = ['🪙', '✨🪙✨', '💫🪙💫', '⚡🪙⚡', result === 'heads' ? '👑' : '🦅'];
    const animStr = ANIM.join(' → ');

    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  🪙 ${bold('COINFLIP RESULT!')}       ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `${animStr}\n\n` +
        `👤 ${bold('Ikaw:')} ${coinEmoji(finalChoice)}\n` +
        `🪙 ${bold('Result:')} ${coinEmoji(result)}\n\n` +
        `${'─'.repeat(30)}\n` +
        `${won ? `🎉 ${bold('NANALO KA!')}` : `😅 ${bold('NATALO KA!')}`}\n` +
        `💰 ${won ? '+' : ''}${winnings} → ${bold(newCoins.toLocaleString())} coins\n` +
        `${'─'.repeat(30)}\n\n` +
        `💡 ${P}coinflip h/t [bet] | ${P}rich`,
        threadID, messageID
    );
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    const P = global.config.PREFIX;

    if (handleReply.type !== 'challenge_pending') return;

    const challenge = activeChallenges.get(handleReply.challengeKey);
    if (!challenge) return api.sendMessage(`⏰ ${bold('Challenge expired!')}`, threadID, messageID);
    if (Date.now() > challenge.expires) {
        activeChallenges.delete(handleReply.challengeKey);
        return api.sendMessage(`⏰ ${bold('Challenge expired!')}`, threadID, messageID);
    }
    if (String(senderID) !== String(challenge.targetID)) return;

    const answer = (body || '').toLowerCase().trim();
    activeChallenges.delete(handleReply.challengeKey);

    if (answer === 'decline') {
        return api.sendMessage(
            `❌ ${bold(challenge.targetName)} declined the coinflip challenge!`,
            threadID, messageID
        );
    }

    if (answer !== 'accept') return;

    // Verify both have enough coins
    const chal = gdb.getPlayer(challenge.challengerID);
    const targ = gdb.getPlayer(challenge.targetID);
    if (!chal || !targ) return api.sendMessage(`❌ ${bold('Player data not found!')}`, threadID, messageID);
    if (challenge.bet > chal.coins || challenge.bet > targ.coins) {
        return api.sendMessage(`❌ ${bold('Kulang ang coins!')} Cancelled.`, threadID, messageID);
    }

    // Flip!
    const result = flip();
    const chalWon = Math.random() < 0.5;
    const winner  = chalWon ? chal  : targ;
    const loser   = chalWon ? targ  : chal;
    const winnerID = chalWon ? challenge.challengerID : challenge.targetID;
    const loserID  = chalWon ? challenge.targetID      : challenge.challengerID;

    const fee      = Math.floor(challenge.bet * 0.05);
    const winnings = challenge.bet - fee;

    const { coins: wc } = gdb.recordGame(winnerID, 'win',   winnings);
    const { coins: lc } = gdb.recordGame(loserID,  'loss', -challenge.bet);

    return api.sendMessage(
        `╔══════════════════════════════╗\n` +
        `║  🪙 ${bold('COINFLIP BATTLE!')}       ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `⚔️ ${bold(chal.name)} vs ${bold(targ.name)}\n` +
        `💰 Bet: ${challenge.bet} coins each\n\n` +
        `🪙 🪙 🪙 → ${coinEmoji(result)}\n\n` +
        `${'─'.repeat(30)}\n` +
        `🏆 ${bold('WINNER:')} ${winner.name}!\n` +
        `💰 +${winnings} → ${bold(wc.toLocaleString())} coins\n\n` +
        `😅 ${bold('LOSER:')} ${loser.name}\n` +
        `💸 -${challenge.bet} → ${bold(lc.toLocaleString())} coins\n` +
        `${'─'.repeat(30)}\n\n` +
        `💡 ${P}rich | ${P}coinflip`,
        threadID, messageID
    );
};
