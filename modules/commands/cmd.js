/**
 * cmd.js — Command module manager (load/unload/list/info)
 * Plain text output, no images
 * TEAM STARTCOPE BETA
 */
const { writeFileSync, readdirSync } = require('fs-extra');
const path = require('path');
const bold = require('../../utils/bold');

const CMDS_DIR = path.join(process.cwd(), 'modules', 'commands');

function getLogger() {
    try { return require('../../utils/log'); }
    catch(e) { return { loader: () => {} }; }
}

function loadModules(moduleList, threadID, messageID, api) {
    const logger = getLogger();
    let configValue;
    try {
        delete require.cache[require.resolve(path.join(process.cwd(), 'config.json'))];
        configValue = require(path.join(process.cwd(), 'config.json'));
    } catch(e) { configValue = global.config || {}; }

    const errors = [];

    for (const name of moduleList) {
        if (!name) { errors.push('- Empty name'); continue; }
        try {
            const fp = path.join(CMDS_DIR, name + '.js');
            delete require.cache[require.resolve(fp)];
            const command = require(fp);
            if (!command.config || !command.run || !command.config.commandCategory)
                throw new Error('Invalid structure (missing config/run/commandCategory)');

            global.client.commands.delete(command.config.name);
            global.client.eventRegistered = global.client.eventRegistered.filter(i => i !== command.config.name);

            if (command.config.envConfig) {
                for (const [k, v] of Object.entries(command.config.envConfig)) {
                    if (!global.configModule[command.config.name]) global.configModule[command.config.name] = {};
                    if (!configValue[command.config.name])         configValue[command.config.name]         = {};
                    global.configModule[command.config.name][k] = configValue[command.config.name][k] || v || '';
                    configValue[command.config.name][k]         = configValue[command.config.name][k] || v || '';
                }
            }

            if (command.onLoad) command.onLoad({ configValue });
            if (command.handleEvent) global.client.eventRegistered.push(command.config.name);

            // Remove from disabled list if present
            if (Array.isArray(global.config.commandDisabled)) {
                const idx = global.config.commandDisabled.indexOf(name + '.js');
                if (idx >= 0) {
                    global.config.commandDisabled.splice(idx, 1);
                    if (Array.isArray(configValue.commandDisabled)) {
                        const idx2 = configValue.commandDisabled.indexOf(name + '.js');
                        if (idx2 >= 0) configValue.commandDisabled.splice(idx2, 1);
                    }
                }
            }

            global.client.commands.set(command.config.name, command);
            if (logger.loader) logger.loader('Loaded: ' + command.config.name);
        } catch(e) {
            errors.push(`- ${name}: ${e.message}`);
        }
    }

    try { writeFileSync(path.join(process.cwd(), 'config.json'), JSON.stringify(configValue, null, 4)); } catch {}

    const loaded = moduleList.length - errors.length;
    let reply = `✅ ${bold('Loaded')} ${loaded}/${moduleList.length} module(s)`;
    if (errors.length) reply += '\n\n❌ ' + bold('Errors:') + '\n' + errors.join('\n');
    api.sendMessage(reply, threadID, messageID);
}

function unloadModules(moduleList, threadID, messageID, api) {
    const logger = getLogger();
    let configValue;
    try {
        delete require.cache[require.resolve(path.join(process.cwd(), 'config.json'))];
        configValue = require(path.join(process.cwd(), 'config.json'));
    } catch(e) { configValue = global.config || {}; }

    if (!Array.isArray(configValue.commandDisabled)) configValue.commandDisabled = [];
    if (!Array.isArray(global.config.commandDisabled)) global.config.commandDisabled = [];

    for (const name of moduleList) {
        if (!name) continue;
        global.client.commands.delete(name);
        global.client.eventRegistered = global.client.eventRegistered.filter(i => i !== name);
        if (!configValue.commandDisabled.includes(name + '.js'))
            configValue.commandDisabled.push(name + '.js');
        if (!global.config.commandDisabled.includes(name + '.js'))
            global.config.commandDisabled.push(name + '.js');
        if (logger.loader) logger.loader('Unloaded: ' + name);
    }

    try { writeFileSync(path.join(process.cwd(), 'config.json'), JSON.stringify(configValue, null, 4)); } catch {}

    api.sendMessage(`✅ ${bold('Unloaded')} ${moduleList.length} module(s)`, threadID, messageID);
}

module.exports.config = {
    name:            'cmd',
    version:         '3.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Manage bot command modules — load, unload, list, info',
    commandCategory: 'Admin',
    usages:          'cmd [load/unload/loadall/unloadall/list/info] [name]',
    cooldowns:       5,
    prefix:          false,
};

module.exports.run = function ({ event, args, api }) {
    const { threadID, messageID } = event;
    const P   = global.config.PREFIX;
    const sub = (args[0] || '').toLowerCase().trim();
    const mods = args.slice(1).map(m => m.trim()).filter(Boolean);

    switch(sub) {
        case 'load':
            if (!mods.length) return api.sendMessage(`❌ Specify module name(s)`, threadID, messageID);
            return loadModules(mods, threadID, messageID, api);

        case 'unload':
            if (!mods.length) return api.sendMessage(`❌ Specify module name(s)`, threadID, messageID);
            return unloadModules(mods, threadID, messageID, api);

        case 'loadall': {
            const all = readdirSync(CMDS_DIR).filter(f => f.endsWith('.js')).map(f => f.replace('.js',''));
            return loadModules(all, threadID, messageID, api);
        }

        case 'unloadall': {
            const all = readdirSync(CMDS_DIR).filter(f => f.endsWith('.js')).map(f => f.replace('.js',''));
            return unloadModules(all, threadID, messageID, api);
        }

        case 'list': {
            const all    = readdirSync(CMDS_DIR).filter(f => f.endsWith('.js')).map(f => f.replace('.js',''));
            const loaded = [...global.client.commands.keys()];
            let msg =
                `╔══════════════════════════╗\n║  📦 ${bold('COMMAND MODULES')}    ║\n╚══════════════════════════╝\n\n` +
                `📊 ${bold('Files:')} ${all.length} | ${bold('Loaded:')} ${loaded.length}\n\n`;
            all.forEach((m, i) => {
                msg += `${i+1}. ${loaded.includes(m) ? '✅' : '⭕'} ${P}${m}\n`;
            });
            msg += `\n✅ = loaded  ⭕ = not loaded`;
            return api.sendMessage(msg, threadID, messageID);
        }

        case 'info': {
            const name = mods[0] || '';
            const cmd  = global.client.commands.get(name);
            if (!cmd) return api.sendMessage(`❌ Module not found: "${name}"`, threadID, messageID);
            const c = cmd.config;
            const p = ['Member','Group Admin','Bot Admin','Owner'][c.hasPermssion ?? 0] || 'Member';
            return api.sendMessage(
                `📦 ${bold('MODULE:')} ${c.name}\n` +
                `${'─'.repeat(24)}\n` +
                `👤 Author: ${c.credits || 'TEAM STARTCOPE BETA'}\n` +
                `📦 Version: ${c.version || '1.0.0'}\n` +
                `🔐 Permission: ${p}\n` +
                `⏳ Cooldown: ${c.cooldowns || 3}s\n` +
                `🏷️ Category: ${c.commandCategory}`,
                threadID, messageID
            );
        }

        default:
            return api.sendMessage(
                `╔══════════════════════════╗\n║  📦 ${bold('CMD MANAGER')}        ║\n╚══════════════════════════╝\n\n` +
                `${P}cmd list — all modules\n` +
                `${P}cmd load [name] — load module\n` +
                `${P}cmd unload [name] — unload module\n` +
                `${P}cmd loadall — reload everything\n` +
                `${P}cmd unloadall — unload all\n` +
                `${P}cmd info [name] — module details`,
                threadID, messageID
            );
    }
};
