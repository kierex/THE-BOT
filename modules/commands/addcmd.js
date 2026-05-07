/**
 * addcmd.js — Dynamic command loader from chat
 * Send !addcmd filename.js then paste the code on the next lines
 * Bot validates structure and hot-loads it permanently
 * TEAM STARTCOPE BETA
 */
const fs   = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const CMDS_DIR = path.join(process.cwd(), 'modules/commands');

function validateCmd(code) {
    const errors = [];
    if (!code.includes('module.exports.config'))   errors.push('Missing: module.exports.config');
    if (!code.includes('module.exports.run'))       errors.push('Missing: module.exports.run');
    if (!code.includes('commandCategory'))          errors.push('Missing: commandCategory in config');
    if (!code.includes('name:'))                    errors.push('Missing: name in config');
    return errors;
}

function hotLoad(filename) {
    const filePath = path.join(CMDS_DIR, filename);
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    if (!command.config || !command.run)
        throw new Error('Invalid module structure after load');
    global.client.commands.delete(command.config.name);
    if (command.handleEvent)
        global.client.eventRegistered.push(command.config.name);
    global.client.commands.set(command.config.name, command);
    return command.config.name;
}

module.exports.config = {
    name:            'addcmd',
    version:         '1.0.0',
    hasPermssion:    2,
    credits:         'xie',
    description:     'Mag-add ng bagong command dynamically mula sa chat',
    commandCategory: 'Admin',
    usages:          'addcmd filename.js [code] OR reply to code with addcmd filename.js',
    cooldowns:       5,
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID, body } = event;
    const P = global.config.PREFIX;

    if (!args[0]) {
        return api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  ➕ ${bold('ADDCMD — ADD COMMAND')}   ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `📋 ${bold('Paano gamitin:')}\n\n` +
            `1. I-type ang:\n` +
            `   ${P}addcmd mycommand.js\n` +
            `   [paste mo ang code dito]\n\n` +
            `2. O reply sa mensahe na may code:\n` +
            `   ${P}addcmd mycommand.js\n\n` +
            `✅ ${bold('Required sa code:')}\n` +
            `   • module.exports.config\n` +
            `   • module.exports.run\n` +
            `   • commandCategory sa config\n` +
            `   • name sa config\n\n` +
            `📌 ${bold('Example filename:')} cat.js, weather.js, etc.`,
            threadID, messageID
        );
    }

    let filename = args[0].trim();
    if (!filename.endsWith('.js')) filename += '.js';
    filename = filename.replace(/[^a-zA-Z0-9_\-\.]/g, '');
    if (!filename) return api.sendMessage(`❌ ${bold('Invalid filename!')}`, threadID, messageID);

    // Extract code from message body (everything after "addcmd filename.js\n")
    let code = '';
    const cmdPrefix = `${P}addcmd ${args[0]}`;
    const bodyAfter = body.substring(body.indexOf(cmdPrefix) + cmdPrefix.length).trim();

    // Check if code is in the message body
    if (bodyAfter.length > 20) {
        code = bodyAfter;
    }
    // Check if replying to a message with code
    else if (event.type === 'message_reply' && event.messageReply?.body) {
        code = event.messageReply.body.trim();
    }

    if (!code || code.length < 30) {
        return api.sendMessage(
            `❌ ${bold('Walang code!')}\n\n` +
            `💡 Gamitin:\n` +
            `${P}addcmd ${filename}\n` +
            `[i-paste ang code dito]\n\n` +
            `O reply sa mensahe na may code ng:\n` +
            `${P}addcmd ${filename}`,
            threadID, messageID
        );
    }

    // Validate code structure
    const errors = validateCmd(code);
    if (errors.length > 0) {
        return api.sendMessage(
            `❌ ${bold('Invalid command structure!')}\n\n` +
            `🔍 ${bold('Mga error na nakita:')}\n` +
            errors.map(e => `• ${e}`).join('\n') +
            `\n\n💡 Tingnan ang structure ng ibang commands para sa reference.`,
            threadID, messageID
        );
    }

    // Safety check — no require of dangerous modules
    const dangerous = ['child_process', 'exec(', 'spawn(', 'eval(', 'Function('];
    for (const d of dangerous) {
        if (code.includes(d)) {
            return api.sendMessage(
                `🚨 ${bold('Security check failed!')}\n\n` +
                `❌ Ang code ay may dangerous na module/function: ${d}\n` +
                `💡 Alisin ang "${d}" at subukan ulit.`,
                threadID, messageID
            );
        }
    }

    const filePath = path.join(CMDS_DIR, filename);
    const exists   = fs.existsSync(filePath);

    try {
        fs.writeFileSync(filePath, code, 'utf8');
        const cmdName = hotLoad(filename);
        return api.sendMessage(
            `╔══════════════════════════════╗\n` +
            `║  ✅ ${bold('COMMAND ADDED!')}         ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `📁 ${bold('File:')} ${filename}\n` +
            `⚡ ${bold('Command name:')} ${global.config.PREFIX}${cmdName}\n` +
            `🔄 ${bold('Status:')} ${exists ? 'Updated' : 'New command added'}\n` +
            `✅ ${bold('Hot-loaded — ready to use now!')}\n\n` +
            `💡 I-type ang ${global.config.PREFIX}${cmdName} para subukan.`,
            threadID, messageID
        );
    } catch(e) {
        // Clean up bad file
        try { if (!exists) fs.removeSync(filePath); } catch {}
        return api.sendMessage(
            `❌ ${bold('Load failed!')}\n\n` +
            `🔧 ${bold('Error:')} ${e.message}\n\n` +
            `💡 I-check ang syntax ng iyong code at subukan ulit.`,
            threadID, messageID
        );
    }
};
