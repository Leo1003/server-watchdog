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

        initialize: cb => {
            strapi.tgbot = new TGBot(strapi.config.hook.settings.tgbot['token'], { polling: false });
            cb();
        },
        sendMessage: async (msg) => {
            await strapi.tgbot.sendMessage(strapi.config.hook.settings.tgbot['gid'], msg);
        }
    };

    return hook;
};
