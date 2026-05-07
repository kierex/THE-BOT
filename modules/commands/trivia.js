/**
 * trivia.js — Trivia Quiz Game (mix ng Tagalog at English)
 * Sagutin ang mga trivia questions at manalo!
 * TEAM STARTCOPE BETA
 */

const bold = require('../../utils/bold');

const QUESTIONS = [
    { q: 'Ano ang pambansang ibon ng Pilipinas?', a: ['philippine eagle', 'agila ng pilipinas', 'agila'], hint: 'Isa itong malaking agila na endemic sa Mindanao' },
    { q: 'Ilang pulo ang mayroon ang Pilipinas?', a: ['7641', '7107', '7,641', '7,107'], hint: 'Mahigit pitong libo' },
    { q: 'Sino ang unang Presidente ng Pilipinas?', a: ['emilio aguinaldo', 'aguinaldo'], hint: 'Siya ay mula sa Kawit, Cavite' },
    { q: 'Ano ang capital ng Japan?', a: ['tokyo'], hint: 'Dito matatagpuan ang Mount Fuji sa background' },
    { q: 'Ano ang pinakamalaking planeta sa solar system?', a: ['jupiter'], hint: 'May malaking Red Spot ito' },
    { q: 'Ano ang chemical symbol ng ginto (gold)?', a: ['au'], hint: 'Mula sa Latin na "Aurum"' },
    { q: 'Ilang degrees ang isang tuwid na linya (straight line)?', a: ['180', '180 degrees'], hint: 'Half ng isang bilog' },
    { q: 'Sino ang nagsulat ng Noli Me Tangere?', a: ['jose rizal', 'rizal'], hint: 'National hero ng Pilipinas' },
    { q: 'Ano ang pinakamaikli na buwan sa taon?', a: ['pebrero', 'february'], hint: 'Pangalawang buwan ng taon' },
    { q: 'Ano ang pambansang wika ng Pilipinas?', a: ['filipino', 'pilipino'], hint: 'Batay ito sa Tagalog' },
    { q: 'Ilang continents ang mayroon sa mundo?', a: ['7', 'pito'], hint: 'Asia, Africa, Europe, Americas, Australia, Antarctica...' },
    { q: 'Ano ang pinakamataas na bundok sa mundo?', a: ['mt everest', 'mount everest', 'everest'], hint: 'Nasa Nepal-Tibet border ito' },
    { q: 'Ano ang water formula (chemical formula ng tubig)?', a: ['h2o', 'h₂o'], hint: '2 hydrogen, 1 oxygen' },
    { q: 'Ano ang pinakamaliit na bansa sa mundo?', a: ['vatican', 'vatican city'], hint: 'Nasa loob ito ng Rome, Italy' },
    { q: 'Ilang kulay ang nasa rainbow (bahaghari)?', a: ['7', 'pito', 'seven'], hint: 'ROYGBIV' },
    { q: 'Ano ang pambansang hayop ng Pilipinas?', a: ['carabao', 'kalabaw'], hint: 'Ginagamit ito sa pagbubukid' },
    { q: 'Sino ang nagtayo ng Eiffel Tower?', a: ['gustave eiffel', 'eiffel'], hint: 'Ginawa noong 1889 para sa World Fair' },
    { q: 'Ano ang pinakamalalim na bahagi ng karagatan sa mundo?', a: ['mariana trench', 'mariana'], hint: 'Nasa Pacific Ocean ito' },
    { q: 'Ano ang pambansang bulaklak ng Pilipinas?', a: ['sampaguita'], hint: 'Puti at mabango' },
    { q: 'Ilang segundo ang isang minuto?', a: ['60', 'animnapu'], hint: 'Basic talaga ito' },
];

const activeGames = new Map();

module.exports.config = {
    name: 'trivia',
    version: '1.0.0',
    hasPermssion: 2,
    credits: 'TEAM STARTCOPE BETA',
    description: 'Trivia Quiz Game — Tagalog at English! Sagutin ang mga tanong at manalo!',
    commandCategory: 'Games',
    usages: 'trivia | trivia hint',
    cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    if (activeGames.has(`${threadID}_${senderID}`)) {
        const game = activeGames.get(`${threadID}_${senderID}`);
        if (args[0]?.toLowerCase() === 'hint') {
            return api.sendMessage(`💡 ${bold('Hint:')} ${game.hint}`, threadID, messageID);
        }
        return api.sendMessage(
            `⚠️ ${bold('May ongoing trivia ka pa!')} Sagutin mo muna.\n💡 I-type ang ${global.config.PREFIX}trivia hint para sa hint.`,
            threadID, messageID
        );
    }

    const q = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    const timeLimit = 30;

    api.sendMessage(
        `╔══════════════════════╗\n` +
        `║  🧠 ${bold('TRIVIA GAME')}     ║\n` +
        `╚══════════════════════╝\n\n` +
        `❓ ${bold('Tanong:')}\n${q.q}\n\n` +
        `⏰ ${bold('Time:')} ${timeLimit} segundo\n` +
        `💡 I-type ang ${global.config.PREFIX}trivia hint para sa hint!\n\n` +
        `✍️ I-reply ang iyong sagot!`,
        threadID,
        (err, info) => {
            if (err || !info) return;
            const timeout = setTimeout(() => {
                activeGames.delete(`${threadID}_${senderID}`);
                api.sendMessage(
                    `⏰ ${bold('Time\'s up!')}\n\n` +
                    `✅ ${bold('Tamang sagot:')} ${q.a[0].toUpperCase()}\n` +
                    `💡 Subukan ulit! ${global.config.PREFIX}trivia`,
                    threadID
                );
            }, timeLimit * 1000);

            activeGames.set(`${threadID}_${senderID}`, { q, timeout, messageID: info.messageID, hint: q.hint });
            global.client.handleReply.push({
                name: 'trivia',
                messageID: info.messageID,
                author: senderID,
                answers: q.a,
                question: q.q,
                hint: q.hint,
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

    const userAnswer = body.trim().toLowerCase();
    const isCorrect = handleReply.answers.some(a => userAnswer === a.toLowerCase());

    if (isCorrect) {
        return api.sendMessage(
            `🎉 ${bold('TAMA! Ang talino mo!')}\n\n` +
            `✅ ${bold('Sagot:')} ${handleReply.answers[0].toUpperCase()}\n` +
            `🏆 Congratulations! Magaling ka talaga!\n\n` +
            `💡 Laro ulit! ${global.config.PREFIX}trivia`,
            threadID, messageID
        );
    } else {
        return api.sendMessage(
            `❌ ${bold('Mali ang sagot!')}\n\n` +
            `❓ ${bold('Tanong:')} ${handleReply.question}\n` +
            `✅ ${bold('Tamang sagot:')} ${handleReply.answers[0].toUpperCase()}\n` +
            `📝 ${bold('Sinabi mo:')} ${body.trim()}\n\n` +
            `💡 Laro ulit! ${global.config.PREFIX}trivia`,
            threadID, messageID
        );
    }
};
