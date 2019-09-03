'use strict';
const _ = require('lodash');

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
    filter(user, query) {
        function _filter(i) {
            return _.pick(i, ['_id', 'name', 'lastPing', 'lastSocketPing']);
        }

        if (!user) {
            if (Array.isArray(query)) {
                return _.map(query, _filter);
            } else {
                return _filter(query);
            }
        } else {
            return query;
        }
    },
    async updateSocketPing(id) {
        return strapi.models.server.updateOne({
            _id: id
        }, {
            lastSocketPing: new Date()
        });
    }
};
