/**
 * trivia.js — Trivia Quiz Game (with persistent game database)
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');
const gdb  = require('../../utils/gamedb');

const QUESTIONS = [
    { q:'Ano ang pambansang ibon ng Pilipinas?',        a:['philippine eagle','agila ng pilipinas','agila'],         hint:'Malaking agila, endemic sa Mindanao' },
    { q:'Ilang pulo ang Pilipinas?',                    a:['7641','7107','7,641','7,107'],                           hint:'Mahigit pitong libo' },
    { q:'Sino ang unang Presidente ng Pilipinas?',      a:['emilio aguinaldo','aguinaldo'],                          hint:'Mula sa Kawit, Cavite' },
    { q:'Ano ang capital ng Japan?',                    a:['tokyo'],                                                 hint:'Dito matatagpuan ang Mount Fuji' },
    { q:'Pinakamalaking planeta sa solar system?',      a:['jupiter'],                                               hint:'May malaking Red Spot' },
    { q:'Chemical symbol ng ginto (gold)?',             a:['au'],                                                    hint:'Latin: Aurum' },
    { q:'Ilang degrees ang isang tuwid na linya?',      a:['180','180 degrees'],                                     hint:'Half ng isang bilog' },
    { q:'Sino ang nagsulat ng Noli Me Tangere?',        a:['jose rizal','rizal'],                                    hint:'National hero ng Pilipinas' },
    { q:'Pinakamaikli na buwan sa taon?',               a:['pebrero','february'],                                    hint:'Pangalawang buwan' },
    { q:'Pambansang wika ng Pilipinas?',                a:['filipino','pilipino'],                                   hint:'Batay sa Tagalog' },
    { q:'Ilang continents ang mayroon sa mundo?',       a:['7','pito'],                                              hint:'Asia, Africa, Europe...' },
    { q:'Pinakamataas na bundok sa mundo?',             a:['mt everest','mount everest','everest'],                   hint:'Nepal-Tibet border' },
    { q:'Chemical formula ng tubig?',                   a:['h2o','h₂o'],                                             hint:'2 hydrogen, 1 oxygen' },
    { q:'Pinakamaliit na bansa sa mundo?',              a:['vatican','vatican city'],                                hint:'Nasa loob ng Rome, Italy' },
    { q:'Ilang kulay ang nasa rainbow?',                a:['7','pito','seven'],                                      hint:'ROYGBIV' },
    { q:'Pambansang hayop ng Pilipinas?',               a:['carabao','kalabaw'],                                     hint:'Ginagamit sa pagbubukid' },
    { q:'Sino ang nagtayo ng Eiffel Tower?',            a:['gustave eiffel','eiffel'],                               hint:'Noong 1889' },
    { q:'Pinakamalalim na bahagi ng karagatan?',        a:['mariana trench','mariana'],                              hint:'Pacific Ocean' },
    { q:'Pambansang bulaklak ng Pilipinas?',            a:['sampaguita'],                                            hint:'Puti at mabango' },
    { q:'Ilang segundo ang isang minuto?',              a:['60','animnapu'],                                         hint:'Basic!' },
    { q:'Sino ang nagsulat ng El Filibusterismo?',      a:['jose rizal','rizal'],                                    hint:'Karugtong ng Noli' },
    { q:'Ano ang capital ng Australia?',                a:['canberra'],                                              hint:'Hindi Sydney' },
    { q:'Pinakamalaking kontinente sa mundo?',          a:['asia'],                                                  hint:'Kasama ang Pilipinas' },
    { q:'Sino ang unang tao na lumakad sa buwan?',      a:['neil armstrong','armstrong'],                            hint:'Apollo 11, 1969' },
    { q:'Ano ang pambansang kulay ng Pilipinas?',       a:['blue white red','blue red white','asul puti pula'],      hint:'Makikita sa bandila' },
];

const activeGames = new Map();
const WIN_COINS   = 100;
const LOSS_COINS  = -30;

module.exports.config = {
    name:            'trivia',
    version:         '3.0.0',
    hasPermssion:    0,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Trivia Quiz — sagutin at manalo ng coins!',
    commandCategory: 'Games',
    usages:          'trivia | trivia hint',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event, args }) {
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
        if ((args[0] || '').toLowerCase() === 'hint') {
            return api.sendMessage(
                `💡 ${bold('Hint:')} ${activeGames.get(gameKey).hint}`,
                threadID, messageID
            );
        }
        return api.sendMessage(
            `⚠️ ${bold('May ongoing trivia ka pa!')}\n💡 ${P}trivia hint para sa hint.`,
            threadID, messageID
        );
    }

    const p   = gdb.getPlayer(senderID);
    const q   = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const tl  = 30;

    api.sendMessage(
        `╔══════════════════════╗\n║  🧠 ${bold('TRIVIA GAME')}     ║\n╚══════════════════════╝\n\n` +
        `💰 ${bold('Coins:')} ${p.coins.toLocaleString()}\n` +
        `🏆 Tama: +${WIN_COINS} | ❌ Mali: ${LOSS_COINS}\n\n` +
        `❓ ${bold('Tanong:')}\n${q.q}\n\n` +
        `⏰ ${bold('Time:')} ${tl} segundo\n` +
        `💡 ${P}trivia hint — para sa hint!\n\n` +
        `✍️ I-reply ang iyong sagot!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            const timeout = setTimeout(() => {
                activeGames.delete(gameKey);
                const { coins: nc } = gdb.recordGame(senderID, 'loss', LOSS_COINS);
                api.sendMessage(
                    `⏰ ${bold("Time's up!")}\n✅ ${bold('Tamang sagot:')} ${q.a[0].toUpperCase()}\n` +
                    `💸 ${LOSS_COINS} coins → ${bold(nc.toLocaleString())} coins`,
                    threadID
                );
            }, tl * 1000);

            activeGames.set(gameKey, { q, timeout, hint: q.hint });
            global.client.handleReply.push({
                name: 'trivia', messageID: info.messageID,
                author: senderID, answers: q.a, question: q.q,
                hint: q.hint, timeoutRef: timeout
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

    const isCorrect = handleReply.answers.some(a =>
        (body || '').trim().toLowerCase() === a.toLowerCase()
    );

    if (isCorrect) {
        const { coins: nc } = gdb.recordGame(senderID, 'win', WIN_COINS);
        return api.sendMessage(
            `🎉 ${bold('TAMA! Ang talino mo!')}\n✅ ${bold('Sagot:')} ${handleReply.answers[0].toUpperCase()}\n` +
            `💰 +${WIN_COINS} coins → ${bold(nc.toLocaleString())} coins\n\n` +
            `🏅 ${global.config.PREFIX}rich — leaderboard`,
            threadID, messageID
        );
    } else {
        const { coins: nc } = gdb.recordGame(senderID, 'loss', LOSS_COINS);
        return api.sendMessage(
            `❌ ${bold('Mali ang sagot!')}\n✅ ${bold('Tamang sagot:')} ${handleReply.answers[0].toUpperCase()}\n` +
            `💸 ${LOSS_COINS} coins → ${bold(nc.toLocaleString())} coins`,
            threadID, messageID
        );
    }
};
