'use strict';

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
        console.log(strapi.services.server);
        let query;
        if (ctx.query._q) {
            query = await strapi.services.server.search(ctx.query);
        } else {
            query = await strapi.services.server.find(ctx.query);
        }
        return strapi.services.server.filter(ctx.state.user, query);
    },

    /**
     * Promise to fetch record
     *
     * @return {Promise}
     */

    async findOne(ctx) {
        let query = await strapi.services.server.findOne(ctx.params);
        return strapi.services.server.filter(ctx.state.user, query);
    },
};
