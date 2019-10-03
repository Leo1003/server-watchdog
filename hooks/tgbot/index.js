'use strict';
const _ = require('lodash');
const TGBot = require('node-telegram-bot-api');

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

            strapi.tgbot.onText(/\/status(\s.+)?/, (msg, match) => {
                let name = match[1];
                let response = "";
                if (name == null) {
                    response += `There are ${strapi.serverStatus.length}:\n`;
                    _.forEach(strapi.serverStatus, s => {
                        response += s.printState();
                    });
                } else {
                    let s = _.find(strapi.serverStatus, s => {
                        return s.name == name;
                    });
                    if (s) {
                        response = s.printState();
                    } else {
                        response = `Server "${name}" not found!`;
                    }
                }
                strapi.tgbot.sendMessage(msg.chat.id, response).then(res => {
                    strapi.log.debug('/status command success.');
                }).catch(err => {
                    strapi.log.error(`${JSON.stringify(err)}`);
                })
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
        }
    };

    return hook;
};
