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
            gid: ""
        },

        /**
         * Initialize the hook
         */

        initialize() {
            this.runtimeEnable = false;
            strapi.tgbot = new TGBot(strapi.config.hook.settings.tgbot['token'], { polling: false });
            strapi.tgbot.getMe().then(info => {
                strapi.log.info(`Telegram bot initialization successfully!`);
                strapi.log.debug(`${JSON.stringify(info)}`);
                this.runtimeEnable = true;
            }).catch(err => {
                strapi.log.warn(`Failed to initialize the telegram bot`);
                strapi.log.warn(`Notify disabled!`);
            });
        },
        sendMessage: async (msg) => {
            if (this.runtimeEnable) {
                return await strapi.tgbot.sendMessage(strapi.config.hook.settings.tgbot['gid'], msg);
            }
            return null;
        }
    };

    return hook;
};
