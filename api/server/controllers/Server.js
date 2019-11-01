'use strict';
const _ = require('lodash');

/**
 * Read the documentation () to implement custom controller functions
 */

module.exports = {
    /**
     * Retrieve records.
     *
     * @return {Array}
     */

    async find(ctx) {
        let query;
        if (ctx.query._q) {
            query = await strapi.services.server.search(ctx.query);
        } else {
            query = await strapi.services.server.find(ctx.query);
        }
        strapi.services.server.appendStatus(query);
        return strapi.services.server.filter(ctx.state.user, query);
    },

    /**
     * Promise to fetch record
     *
     * @return {Promise}
     */

    async findOne(ctx) {
        let query = await strapi.services.server.findOne(ctx.params);
        if (!query) {
            return null;
        }
        strapi.services.server.appendStatus(query);
        return strapi.services.server.filter(ctx.state.user, query);
    },

    /**
     * Create a record.
     *
     * @return {Promise}
     */

    async create(ctx) {
        let data = _.pick(ctx.request.body, ['name', 'pingurl', 'timeout', 'interval']);
        return strapi.services.server.create(data);
    },

    /**
     * Update a record.
     *
     * @return {Promise}
     */

    async update(ctx) {
        let data = _.pick(ctx.request.body, ['name', 'pingurl', 'timeout', 'interval']);
        let result = await strapi.services.server.update(ctx.params, data);
        strapi.serverStatus = await strapi.services.server.reloadServerStatus(strapi.serverStatus);
        return result;
    },

    /**
     * Renew a server's token.
     *
     * @return {Promise}
     */

    async renewToken(ctx) {
        let data = {
            token: strapi.services.server.generateToken()
        };
        let result = await strapi.services.server.update(ctx.params, data);
        if (result.id && strapi.serverStatus[result.id] && strapi.serverStatus[result.id].ws) {
            strapi.log.info(`Closing websocket for ${result.name} due to token reset.`);
            strapi.serverStatus[result.id].ws.close(1012, 'Token Reset');
        }
        return result;
    },

    async bottest(ctx) {
        try {
            if (strapi.hook.tgbot.isEnable()) {
                let result = await strapi.hook.tgbot.sendMessage('---Server Watchdog Testing---\nThis is a test message to test if you can receive notification from this bot.');
                strapi.log.info('Test notification sent successfully.');
                return result;
            } else {
                ctx.response.forbidden('Notification disabled!');
            }
        } catch (err) {
            ctx.response.internal('Test notification failed', err);
            strapi.log.error(`Error when sending test notification: ${err}`);
        }
    },
};
