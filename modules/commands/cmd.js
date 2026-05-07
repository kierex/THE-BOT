/**
 * cmd.js — Command module manager (load/unload/info)
 * Plain text output, no images
 * TEAM STARTCOPE BETA
 */
const { writeFileSync } = require('fs-extra');
const bold = require('../../utils/bold');

function loadCommands({ moduleList, threadID, messageID, api }) {
    const logger = require(global.client.mainPath + '/utils/log');
    delete require.cache[require.resolve(process.cwd() + '/config.json')];
    const configValue = require(process.cwd() + '/config.json');
    const errors = [];

    for (const nameModule of moduleList) {
        if (!nameModule) { errors.push('- Empty module name'); continue; }
        try {
            const dir = __dirname + '/' + nameModule + '.js';
            delete require.cache[require.resolve(dir)];
            const command = require(dir);
            global.client.commands.delete(nameModule);
            if (!command.config || !command.run || !command.config.commandCategory)
                throw new Error('Invalid structure');
            global.client.eventRegistered = global.client.eventRegistered.filter(i => i !== command.config.name);
            if (command.config.envConfig) {
                for (const [k, v] of Object.entries(command.config.envConfig)) {
                    if (!global.configModule[command.config.name]) global.configModule[command.config.name] = {};
                    if (!configValue[command.config.name]) configValue[command.config.name] = {};
                    global.configModule[command.config.name][k] = configValue[command.config.name][k] || v || '';
                    configValue[command.config.name][k] = configValue[command.config.name][k] || v || '';
                }
            }
            if (command.onLoad) command.onLoad({ configValue });
            if (command.handleEvent) global.client.eventRegistered.push(command.config.name);
            if (global.config.commandDisabled.includes(nameModule + '.js')) {
                configValue.commandDisabled.splice(configValue.commandDisabled.indexOf(nameModule + '.js'), 1);
                global.config.commandDisabled.splice(global.config.commandDisabled.indexOf(nameModule + '.js'), 1);
            }
            global.client.commands.set(command.config.name, command);
            logger.loader('Loaded: ' + command.config.name);
        } catch(e) {
            errors.push(`- ${nameModule}: ${e.message}`);
        }
    }
    writeFileSync(process.cwd() + '/config.json', JSON.stringify(configValue, null, 4));
    const loaded = moduleList.length - errors.length;
    let reply = `✅ Loaded ${loaded}/${moduleList.length} module(s)`;
    if (errors.length) reply += '\n\n❌ Errors:\n' + errors.join('\n');
    api.sendMessage(reply, threadID, messageID);
}

function unloadCommands({ moduleList, threadID, messageID, api }) {
    const logger = require(global.client.mainPath + '/utils/log').loader;
    delete require.cache[require.resolve(process.cwd() + '/config.json')];
    const configValue = require(process.cwd() + '/config.json');
    for (const name of moduleList) {
        if (!name) continue;
        global.client.commands.delete(name);
        global.client.eventRegistered = global.client.eventRegistered.filter(i => i !== name);
        configValue.commandDisabled.push(`${name}.js`);
        global.config.commandDisabled.push(`${name}.js`);
        logger('Unloaded: ' + name);
    }
    writeFileSync(process.cwd() + '/config.json', JSON.stringify(configValue, null, 4));
    api.sendMessage(`✅ Unloaded ${moduleList.length} module(s)`, threadID, messageID);
}

module.exports.config = {
    name:            'cmd',
    version:         '2.0.0',
    hasPermssion:    2,
    credits:         'TEAM STARTCOPE BETA',
    description:     'Manage bot command modules — load, unload, list, info',
    commandCategory: 'Admin',
    usages:          'cmd [load/unload/loadall/unloadall/list/info] [module name]',
    cooldowns:       5,
    prefix:          false,
};

module.exports.run = function ({ event, args, api }) {
    const { readdirSync } = require('fs-extra');
    const { threadID, messageID } = event;
    const P      = global.config.PREFIX;
    const sub    = (args[0] || '').toLowerCase();
    const mods   = args.slice(1).map(m => m.trim()).filter(Boolean);

    switch (sub) {
        case 'load':
            if (!mods.length) return api.sendMessage('❌ Specify module name(s)', threadID, messageID);
            return loadCommands({ moduleList: mods, threadID, messageID, api });

        case 'unload':
            if (!mods.length) return api.sendMessage('❌ Specify module name(s)', threadID, messageID);
            return unloadCommands({ moduleList: mods, threadID, messageID, api });

        case 'loadall': {
            const all = readdirSync(__dirname).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
            return loadCommands({ moduleList: all, threadID, messageID, api });
        }

        case 'unloadall': {
            const all = readdirSync(__dirname).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
            return unloadCommands({ moduleList: all, threadID, messageID, api });
        }

        case 'list': {
            const all    = readdirSync(__dirname).filter(f => f.endsWith('.js')).map(f => f.replace(/\.js$/, ''));
            const loaded = [...global.client.commands.keys()];
            let msg =
                `╔══════════════════════════╗\n` +
                `║  📦 ${bold('COMMAND MODULES')}    ║\n` +
                `╚══════════════════════════╝\n\n` +
                `📊 ${bold('Files:')} ${all.length} | ${bold('Loaded:')} ${loaded.length}\n\n`;
            all.forEach((m, i) => {
                const isLoaded = loaded.includes(m);
                msg += `${i + 1}. ${isLoaded ? '✅' : '⭕'} ${P}${m}\n`;
            });
            msg += `\n💡 ✅ = loaded  ⭕ = not loaded\n`;
            msg += `${P}cmd load [name] / unload [name]`;
            return api.sendMessage(msg, threadID, messageID);
        }

        case 'info': {
            const name = mods.join('') || '';
            const cmd  = global.client.commands.get(name);
            if (!cmd) return api.sendMessage(`❌ Module not found: "${name}"`, threadID, messageID);
            const c = cmd.config;
            return api.sendMessage(
                `📦 ${bold('MODULE INFO')}: ${c.name}\n` +
                `─────────────────────\n` +
                `👤 Author: ${c.credits}\n` +
                `📦 Version: ${c.version}\n` +
                `🔐 Permission: ${c.hasPermssion === 0 ? 'Member' : c.hasPermssion === 1 ? 'Group Admin' : c.hasPermssion === 2 ? 'Bot Admin' : 'Owner'}\n` +
                `⏳ Cooldown: ${c.cooldowns}s\n` +
                `📦 Deps: ${Object.keys(c.dependencies || {}).join(', ') || 'None'}`,
                threadID, messageID
            );
        }

        default:
            return api.sendMessage(
                `╔══════════════════════════╗\n` +
                `║  📦 ${bold('CMD MANAGER')}        ║\n` +
                `╚══════════════════════════╝\n\n` +
                `${P}cmd list — all modules\n` +
                `${P}cmd load [name] — load module\n` +
                `${P}cmd unload [name] — unload module\n` +
                `${P}cmd loadall — load all\n` +
                `${P}cmd unloadall — unload all\n` +
                `${P}cmd info [name] — module details`,
                threadID, messageID
            );
    }
};
