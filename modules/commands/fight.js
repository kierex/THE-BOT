/**
 * fight.js — 1v1 Anime Battle System with real fighting GIFs
 * Images fetched from nekos.best / waifu.pics / some-random-api (free, no key)
 * Supports: !fight (vs bot) | !fight @user | !fight all (battle royale)
 * TEAM STARTCOPE BETA
 */
const bold         = require('../../utils/bold');
const gdb          = require('../../utils/gamedb');
const { getFightImage, cleanupLater } = require('../../utils/fightimages');
const fs           = require('fs-extra');

const pendingFights = new Map(); // challenge waiting for accept

// ── Battle config ─────────────────────────────────────────────────────────────
const MAX_HP     = 200;
const ROUNDS     = 5;
const WIN_COINS  = 80;
const LOSS_COINS = -30;

// ── Move pool ─────────────────────────────────────────────────────────────────
const MOVES = [
    { name: 'Kamehameha',     dmg: [35,55], crit: 0.15, img: 'shoot',     emoji: '💥' },
    { name: 'Spirit Bomb',    dmg: [40,60], crit: 0.10, img: 'shoot',     emoji: '🔮' },
    { name: 'Final Flash',    dmg: [30,50], crit: 0.20, img: 'punch',     emoji: '⚡' },
    { name: 'Dragon Fist',    dmg: [25,45], crit: 0.25, img: 'punch',     emoji: '🐉' },
    { name: 'Super Kick',     dmg: [20,40], crit: 0.20, img: 'kick',      emoji: '🦵' },
    { name: 'Death Beam',     dmg: [35,50], crit: 0.15, img: 'stab',      emoji: '☠️'  },
    { name: 'Galick Gun',     dmg: [30,55], crit: 0.12, img: 'shoot',     emoji: '🟣' },
    { name: 'Big Bang Attack',dmg: [45,65], crit: 0.08, img: 'nosebleed', emoji: '💣' },
    { name: 'Solar Flare',    dmg: [15,30], crit: 0.30, img: 'slap',      emoji: '☀️'  },
    { name: 'Hellzone Grenade',dmg:[40,60], crit: 0.12, img: 'stab',      emoji: '💚' },
];

function randMove() { return MOVES[Math.floor(Math.random() * MOVES.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function calcDamage(move) {
    const base = randInt(move.dmg[0], move.dmg[1]);
    const isCrit = Math.random() < move.crit;
    return { dmg: isCrit ? Math.floor(base * 1.8) : base, crit: isCrit };
}

function hpBar(hp, max, len = 10) {
    const filled = Math.max(0, Math.round((hp / max) * len));
    const bar    = '█'.repeat(filled) + '░'.repeat(Math.max(0, len - filled));
    const pct    = Math.max(0, Math.round((hp / max) * 100));
    const color  = pct > 60 ? '🟢' : pct > 30 ? '🟡' : '🔴';
    return `${color} [${bar}] ${hp}/${max}`;
}

// ── Simulate auto-battle, return round log ────────────────────────────────────
function simulateBattle(aName, bName) {
    let aHP = MAX_HP, bHP = MAX_HP;
    const log = [];

    for (let r = 1; r <= ROUNDS; r++) {
        if (aHP <= 0 || bHP <= 0) break;

        const aMove  = randMove();
        const bMove  = randMove();
        const aDmg   = calcDamage(aMove);
        const bDmg   = calcDamage(bMove);

        bHP = Math.max(0, bHP - aDmg.dmg);
        aHP = Math.max(0, aHP - bDmg.dmg);

        log.push({
            round: r,
            aMove: aMove.name, aEmoji: aMove.emoji, aDmg: aDmg.dmg, aCrit: aDmg.crit,
            bMove: bMove.name, bEmoji: bMove.emoji, bDmg: bDmg.dmg, bCrit: bDmg.crit,
            aHP, bHP
        });
    }

    const winner = aHP > bHP ? 'a' : bHP > aHP ? 'b' : 'draw';
    return { log, aHP, bHP, winner };
}

function buildBattleLog(aName, bName, battle, short = false) {
    const rounds = short ? battle.log.slice(-2) : battle.log;
    let txt = '';
    for (const r of rounds) {
        txt += `── Round ${r.round} ──\n`;
        txt += `${r.aEmoji} ${aName}: ${r.aMove}${r.aCrit?' 💢CRIT!':''} → ${r.aDmg} DMG\n`;
        txt += `${r.bEmoji} ${bName}: ${r.bMove}${r.bCrit?' 💢CRIT!':''} → ${r.bDmg} DMG\n`;
        txt += `❤️ ${aName}: ${hpBar(r.aHP, MAX_HP)}\n`;
        txt += `❤️ ${bName}: ${hpBar(r.bHP, MAX_HP)}\n\n`;
    }
    return txt;
}

module.exports.config = {
    name:            'fight',
    version:         '3.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Anime 1v1 battle with real fight images — Dragon Ball style!',
    commandCategory: 'Games',
    usages:          'fight | fight @user | fight all',
    cooldowns:       8,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, mentions } = event;
    const P = global.config.PREFIX;

    if (!gdb.isRegistered(senderID)) {
        return api.sendMessage(
            `❌ ${bold('Mag-register muna!')}\n💡 ${P}register — libre at may 100 starting coins!`,
            threadID, messageID
        );
    }

    const me = gdb.getPlayer(senderID);

    // ── FIGHT ALL — Battle Royale ─────────────────────────────────────────────
    if ((args[0] || '').toLowerCase() === 'all') {
        const allPlayers = Object.entries(gdb.getAllPlayers())
            .filter(([, p]) => p.registered)
            .map(([uid, p]) => ({ uid, ...p }));

        if (allPlayers.length < 2) {
            return api.sendMessage(
                `❌ ${bold('Kulang pa ang players!')}\n` +
                `👥 Kailangan ng 2+ registered players.\n` +
                `💡 ${P}register para sumali.`,
                threadID, messageID
            );
        }

        api.setMessageReaction('⚔️', messageID, () => {}, true);

        // Shuffle and create pairs
        const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
        const pairs    = [];
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            pairs.push([shuffled[i], shuffled[i + 1]]);
        }
        const winner = shuffled.length % 2 !== 0 ? shuffled[shuffled.length - 1] : null;

        // Fetch one battle image
        const imgInfo = await getFightImage('punch');

        let royaleLog =
            `╔══════════════════════════════╗\n` +
            `║  ⚔️ ${bold('BATTLE ROYALE!')}          ║\n` +
            `║  🔥 ${bold('LAHAT LALABAN!')}          ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `👥 ${bold(allPlayers.length)} players enter — 1 survives!\n\n`;

        const results = [];
        for (const [pa, pb] of pairs) {
            const battle = simulateBattle(pa.name, pb.name);
            const winnerP = battle.winner === 'a' ? pa : battle.winner === 'b' ? pb : null;
            const loserP  = battle.winner === 'a' ? pb : battle.winner === 'b' ? pa : null;

            if (winnerP && loserP) {
                gdb.recordGame(winnerP.uid, 'win',  WIN_COINS);
                gdb.recordGame(loserP.uid,  'loss', LOSS_COINS);
                results.push(`⚔️ ${bold(pa.name)} vs ${bold(pb.name)}\n   🏆 ${winnerP.name} wins! (+${WIN_COINS}💰)`);
            } else {
                results.push(`⚔️ ${bold(pa.name)} vs ${bold(pb.name)}\n   🤝 Draw!`);
            }
        }

        royaleLog += results.join('\n\n');
        if (winner) royaleLog += `\n\n🍀 ${bold(winner.name)} got a bye (no opponent)!`;
        royaleLog += `\n\n${'─'.repeat(30)}\n💡 ${P}rich — updated leaderboard`;

        if (imgInfo) {
            api.sendMessage({
                body: royaleLog,
                attachment: fs.createReadStream(imgInfo.filePath)
            }, threadID, () => cleanupLater(imgInfo.filePath));
        } else {
            api.sendMessage(royaleLog, threadID);
        }

        api.setMessageReaction('✅', messageID, () => {}, true);
        return;
    }

    // ── CHALLENGE @USER ───────────────────────────────────────────────────────
    const mentionIDs = Object.keys(mentions || {});
    if (mentionIDs.length > 0) {
        const targetID = mentionIDs[0];
        if (String(targetID) === String(senderID)) {
            return api.sendMessage(`❎ ${bold('Hindi mo ma-challenge ang sarili mo!')}`, threadID, messageID);
        }
        if (!gdb.isRegistered(targetID)) {
            return api.sendMessage(
                `❎ ${bold('Hindi pa registered ang kausap!')}  Kailangan ${P}register muna.`,
                threadID, messageID
            );
        }
        const target = gdb.getPlayer(targetID);
        pendingFights.set(`${threadID}_${senderID}`, {
            challengerID: senderID, challengerName: me.name,
            targetID, targetName: target.name,
            expires: Date.now() + 60000
        });

        api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  ⚔️ ${bold('FIGHT CHALLENGE!')}        ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `🔥 ${bold(me.name)} is challenging ${bold(target.name)}!\n\n` +
            `${mentions[targetID] || target.name}, i-reply ang:\n` +
            `✅ "accept" para lumaban!\n` +
            `❌ "decline" para umiwas\n\n` +
            `⏰ 60 segundo ka lang!\n` +
            `🏆 Winner: +${WIN_COINS} coins | Loser: ${LOSS_COINS} coins`,
            threadID,
            (err, info) => {
                if (err || !info) return;
                global.client.handleReply.push({
                    name: 'fight', messageID: info.messageID,
                    type: 'challenge_pending',
                    challengeKey: `${threadID}_${senderID}`
                });
            },
            messageID
        );
        return;
    }

    // ── VS BOT ────────────────────────────────────────────────────────────────
    api.setMessageReaction('⚔️', messageID, () => {}, true);

    const botName  = global.config.BOTNAME || 'THE-BOT';
    const battle   = simulateBattle(me.name, botName);
    const playerWon= battle.winner === 'a';
    const isDraw   = battle.winner === 'draw';

    const coinChange = isDraw ? 10 : playerWon ? WIN_COINS : LOSS_COINS;
    const result     = isDraw ? 'draw' : playerWon ? 'win' : 'loss';
    const { coins: newCoins } = gdb.recordGame(senderID, result, coinChange);

    // Fetch fight image asynchronously
    const moveUsed = battle.log[battle.log.length - 1];
    const imgInfo  = await getFightImage(moveUsed ? MOVES.find(m => m.name === moveUsed.aMove)?.img : null);

    const battleText =
        `╔══════════════════════════════╗\n` +
        `║  ⚔️ ${bold('ANIME BATTLE!')}           ║\n` +
        `║  🐉 ${bold('DRAGON BALL STYLE!')}      ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `👤 ${bold(me.name)} vs 🤖 ${bold(botName)}\n\n` +
        buildBattleLog(me.name, botName, battle, true) +
        `${'─'.repeat(30)}\n` +
        `${isDraw   ? `🤝 ${bold('DRAW!')}` :
           playerWon ? `🎉 ${bold('NANALO KA!')} 🏆` :
                       `😅 ${bold('NATALO KA!')} 💀`}\n\n` +
        `❤️ ${bold(me.name)}: ${battle.aHP}/${MAX_HP} HP\n` +
        `❤️ ${bold(botName)}: ${battle.bHP}/${MAX_HP} HP\n\n` +
        `💰 ${coinChange >= 0 ? '+' : ''}${coinChange} → ${bold(newCoins.toLocaleString())} coins\n` +
        `${'─'.repeat(30)}\n` +
        `💡 ${P}fight @user | ${P}fight all | ${P}rich`;

    api.setMessageReaction(playerWon ? '🏆' : isDraw ? '🤝' : '💀', messageID, () => {}, true);

    if (imgInfo) {
        api.sendMessage({
            body: battleText,
            attachment: fs.createReadStream(imgInfo.filePath)
        }, threadID, (err) => {
            if (imgInfo.filePath) cleanupLater(imgInfo.filePath);
        });
    } else {
        api.sendMessage(battleText, threadID);
    }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
    const { threadID, messageID, senderID, body } = event;
    const P = global.config.PREFIX;

    if (handleReply.type !== 'challenge_pending') return;

    const challenge = pendingFights.get(handleReply.challengeKey);
    if (!challenge || Date.now() > challenge.expires) {
        pendingFights.delete(handleReply.challengeKey);
        return api.sendMessage(`⏰ ${bold('Fight challenge expired!')}`, threadID, messageID);
    }
    if (String(senderID) !== String(challenge.targetID)) return;

    const answer = (body || '').toLowerCase().trim();
    pendingFights.delete(handleReply.challengeKey);

    if (answer === 'decline') {
        return api.sendMessage(
            `❌ ${bold(challenge.targetName)} dodged the fight! Pikon! 😂`,
            threadID, messageID
        );
    }
    if (answer !== 'accept') return;

    if (!gdb.isRegistered(challenge.challengerID) || !gdb.isRegistered(challenge.targetID)) {
        return api.sendMessage(`❌ ${bold('Player data missing!')} Mag-register ulit.`, threadID, messageID);
    }

    api.setMessageReaction('⚔️', messageID, () => {}, true);

    const chalP   = gdb.getPlayer(challenge.challengerID);
    const targP   = gdb.getPlayer(challenge.targetID);
    const battle  = simulateBattle(chalP.name, targP.name);
    const winnerP = battle.winner === 'a' ? chalP : battle.winner === 'b' ? targP : null;
    const loserP  = battle.winner === 'a' ? targP : battle.winner === 'b' ? chalP : null;
    const isDraw  = battle.winner === 'draw';

    if (!isDraw && winnerP && loserP) {
        const wID = winnerP.uid || (battle.winner === 'a' ? challenge.challengerID : challenge.targetID);
        const lID = loserP.uid  || (battle.winner === 'a' ? challenge.targetID    : challenge.challengerID);
        gdb.recordGame(wID, 'win',  WIN_COINS);
        gdb.recordGame(lID, 'loss', LOSS_COINS);
    } else if (isDraw) {
        gdb.recordGame(challenge.challengerID, 'draw', 10);
        gdb.recordGame(challenge.targetID,     'draw', 10);
    }

    const imgInfo = await getFightImage('kick');
    const battleText =
        `╔══════════════════════════════╗\n` +
        `║  ⚔️ ${bold('1v1 BATTLE!')}             ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `🔥 ${bold(chalP.name)} vs ${bold(targP.name)}\n\n` +
        buildBattleLog(chalP.name, targP.name, battle, true) +
        `${'─'.repeat(30)}\n` +
        (isDraw
            ? `🤝 ${bold('DRAW!')} Both survive!`
            : `🏆 ${bold('WINNER:')} ${winnerP!.name} (+${WIN_COINS} coins)\n💀 ${bold('LOSER:')} ${loserP!.name} (${LOSS_COINS} coins)`) +
        `\n${'─'.repeat(30)}\n💡 ${P}rich — updated standings`;

    api.setMessageReaction(isDraw ? '🤝' : '🏆', messageID, () => {}, true);

    if (imgInfo) {
        api.sendMessage({
            body: battleText,
            attachment: fs.createReadStream(imgInfo.filePath)
        }, threadID, () => cleanupLater(imgInfo.filePath));
    } else {
        api.sendMessage(battleText, threadID);
    }
};
