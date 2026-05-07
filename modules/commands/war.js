/**
 * war.js — Naghahamon ng Away! Tagalog spam/challenge command
 * Mag-spam ng challenge messages sa GC
 * TEAM STARTCOPE BETA
 */
const bold = require('../../utils/bold');

const WAR_LINES = [
    '🔥 HAMON KITA! Lumabas ka dito at harapin mo ako! Takot ka ba?! 😤',
    '💪 MAKIPAGAWAY KA SAKIN KUNG MATAPANG KA! Wag ka magtago sa sulok! 😡',
    '⚔️ HAY NAKO! Sinong marunong tumaban dito?! Lumabas na! DUWAG! 😤🔥',
    '🥊 KAYA MO BA?! Siguro hindi e! Baka lumuhod ka pa sakin! HAHAHA! 😂',
    '💥 TIGNAN NATIN KUNG SINO ANG TOTOONG MATAPANG DITO! Lakad na! 🔥',
    '😤 HARAP-HARAPAN TAYO! Wag kang magpaka-duwag! KAYA MO BA?! ⚔️',
    '🌪️ AWAY AWAY AWAY! SINO ANG MAY LAKAS NG LOOB DITO?! LUMABAS! 💢',
    '🔥 HAHANAPIN KITA SA LAHAT NG SULOK! Wag kang magtago! DUWAG! 😡',
    '⚡ LABAN-LABANAN NATIN ITO! Kung hindi ka matatakot, lumapit ka! 💪',
    '🥊 BAKA LANG! BAKA LANG MATAPANG KA! Patunayan mo nga! Sama-sama! 🔥',
    '😤 PAKITANG GILAS MO! O wala kang lakas? Siguradong DUWAG KA! 💢',
    '⚔️ ANG LAKAS KO HANDA PARA SA LAHAT! Sino pa ang gustong tumatalo? 😤',
    '🌪️ GIYERA! GIYERA! GIYERA! Sino ang makakasagap ng aking galit?! ⚡',
    '💥 BOOM! Patay ka na! O sige, subukan mong labanan ako! HAHAHA! 🔥',
    '😡 AKIN NA ITO! Wag kang lumaban kung takot ka! DUWAG DUWAG DUWAG! 💪',
    '🔥 WALANG TATALO SA AKIN DITO! Isa-isa kayong lumapit! HARAP! ⚔️',
    '⚡ TITIGASIN KO ANG LOOB MO! Kung marunong kang lumaban, lumabas! 💢',
    '🥊 TAKAS KA NA ULIT?! BILANG ISANG DUWAG, HUWAG KA NANG UMANGAL! 😤',
    '💥 PANAHON NA PARA LUMABAN! Handa ba kayo?! AKO AY HANDA NA! 🌪️',
    '😡 LABAS KA NA! HABANG BUHAY KONG HAHANAP SAYO! DUWAG NA DUWAG! ⚔️',
];

module.exports.config = {
    name:            'war',
    version:         '1.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Naghahamon ng away! Mag-spam ng challenge messages sa GC',
    commandCategory: 'Admin',
    usages:          'war [times (1-5)] | war [target name]',
    cooldowns:       10,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    const P = global.config.PREFIX;

    if (!args[0]) {
        return api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  ⚔️ ${bold('WAR — HAMON NG AWAY!')}   ║\n` +
            `║  🔥 ${bold('TEAM STARTCOPE BETA')}  ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `💢 ${bold('Naghahamon ng away sa GC!')}\n\n` +
            `📋 ${bold('Usage:')}\n` +
            `${P}war — mag-spam ng 3 challenge messages\n` +
            `${P}war 5 — mag-spam ng 5 messages (max)\n` +
            `${P}war [pangalan] — hamunin ang specific na tao\n\n` +
            `⚠️ ${bold('Warning:')} Admin only. Gamitin nang maingat!`,
            threadID, messageID
        );
    }

    const num    = parseInt(args[0]);
    const target = isNaN(num) ? args.join(' ').trim() : null;
    const times  = (!isNaN(num) && num >= 1 && num <= 5) ? num : 3;

    api.setMessageReaction('⚔️', messageID, () => {}, true);

    if (target) {
        // Challenge specific person
        const taunt = `🔥⚔️ ${bold('HAMON!')} ⚔️🔥\n\n` +
            `🎯 ${bold(`@${target}`)}, NAGHAHAMON KO SAYO!\n` +
            `💪 LUMABAS KA DITO AT HARAPIN MO AKO!\n` +
            `😤 TAKOT KA BA? DUWAG! DUWAG! DUWAG!\n` +
            `⚡ PAKITANG GILAS MO KUNG MATAPANG KA!\n` +
            `🌪️ WALANG TATALO SAKIN DITO! HARAP NA! 💥\n\n` +
            `⚔️ — ${bold('TEAM STARTCOPE BETA')} — ⚔️`;
        return api.sendMessage(taunt, threadID, messageID);
    }

    // Spam challenge messages
    const used   = new Set();
    const picks  = [];
    while (picks.length < times) {
        const i = Math.floor(Math.random() * WAR_LINES.length);
        if (!used.has(i)) { used.add(i); picks.push(WAR_LINES[i]); }
    }

    for (let i = 0; i < picks.length; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 0 : 1200));
        await new Promise((res) => {
            api.sendMessage(picks[i], threadID, () => res());
        });
    }

    // Final war cry
    await new Promise(r => setTimeout(r, 1500));
    api.sendMessage(
        `🔥⚔️ ${bold('GIYERA GIYERA GIYERA!')} ⚔️🔥\n\n` +
        `💢 ${times} challenge messages sent!\n` +
        `😤 SINO ANG TATALO SAKIN DITO?!\n` +
        `⚡ LUMABAS NA KUNG MATAPANG KAY0!\n\n` +
        `⚔️ — ${bold('MGA UGOK')} — ⚔️`,
        threadID
    );
};
