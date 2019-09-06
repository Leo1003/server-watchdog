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
        query = _.invokeMap(query, 'toObject');
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
        query = query.toObject();
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
        }
        let result = await strapi.services.server.update(ctx.params, data);
        if (result._id && strapi.serverStatus[result._id] && strapi.serverStatus[result._id].ws) {
            strapi.log.info(`Closing websocket for ${result.name} due to token reset.`);
            strapi.serverStatus[result._id].ws.close(1012, 'Token Reset');
        }
        return result;
    },
};
