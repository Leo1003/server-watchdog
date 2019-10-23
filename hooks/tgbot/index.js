'use strict';
const _ = require('lodash');
const TGBot = require('node-telegram-bot-api');
const pjson = require('../../package.json');

module.exports = strapi => {
    const hook = {

        /**
         * Default options
         */

        defaults: {
            token: "",
            chatid: ""
        },

        /**
         * Initialize the hook
         */

        initialize() {
            strapi.hook.tgbot.runtimeEnable = false;
            strapi.tgbot = new TGBot(strapi.config.hook.settings.tgbot['token'], { polling: false });
            strapi.tgbot.getMe().then(info => {
                strapi.log.info(`Telegram bot initialization successfully!`);
                strapi.log.debug(`${JSON.stringify(info)}`);
                strapi.hook.tgbot.runtimeEnable = true;
                return strapi.tgbot.startPolling();
            }).then(res => {
                strapi.log.debug(`Polling enabled!`);
            }).catch(err => {
                strapi.log.warn(`Failed to initialize the telegram bot`);
                strapi.log.warn(`Notification disabled!`);
            });

            // The status command
            strapi.tgbot.onText(/^\/status(?:\@\S+)?(?: +(\S+))?$/, (msg, match) => {
                strapi.tgbot.sendCmdReply(msg.chat.id, strapi.tgbot.tgCmd_status(match[1]), 'status');
            });

            // The version command
            strapi.tgbot.onText(/^\/version(?:\@\S+)?$/, (msg, match) => {
                strapi.tgbot.sendCmdReply(msg.chat.id, strapi.tgbot.tgCmd_version(), 'version');
            });
        },
        isEnable() {
            return strapi.hook.tgbot.runtimeEnable;
        },
        sendMessage: async (msg) => {
            if (strapi.hook.tgbot.runtimeEnable) {
                return await strapi.tgbot.sendMessage(strapi.config.hook.settings.tgbot['chatid'], msg);
            }
            return null;
        },
        sendCmdReply(id, msg, commandName) {
            strapi.tgbot.sendMessage(id, msg).then(res => {
                strapi.log.debug(`/${commandName} command success.`);
            }).catch(err => {
                strapi.log.error(`Error occurred when sending response of /${commandName}`);
                strapi.log.error(`${JSON.stringify(err)}`);
            })
        },
        tgCmd_status(name) {
            let response = "";
            if (!name) {
                response += `There are ${_.size(strapi.serverStatus)} servers:\n`;
                _.forEach(strapi.serverStatus, s => {
                    response += s.printState();
                });
            } else {
                name = name.trim();
                let s = _.find(strapi.serverStatus, s => {
                    return s.name == name;
                });
                if (s) {
                    response = s.printState();
                } else {
                    response = `Server "${name}" not found!`;
                }
            }
            return response;
        },
        tgCmd_version() {
            return `Current Bot Version: ${pjson.version}\n` +
            `Node JS Version: ${process.version}`;
        }
    };

    return hook;
};
