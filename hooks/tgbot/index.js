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
            }).catch(err => {
                strapi.log.warn(`Failed to initialize the telegram bot`);
                strapi.log.warn(`Notification disabled!`);
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
