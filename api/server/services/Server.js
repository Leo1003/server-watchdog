'use strict';
const _ = require('lodash');
const randomstring = require('randomstring');
const {ServerState, ServerStatus} = require('../../../serverStatus.js');
const WebSocket = require('ws');

/**
 * Read the documentation () to implement custom service functions
 */

module.exports = {
    filter(user, query) {
        function _filter(i) {
            return _.pick(i, ['id', 'name', 'lastPing', 'lastSocketPing', 'status']);
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
    generateToken() {
        return randomstring.generate();
    },
    appendStatus(item) {
        function _appendSingle(i) {
            if (i._id && strapi.serverStatus[i._id]) {
                i.status = strapi.serverStatus[i._id].status;
                if (strapi.serverStatus[i._id].ws) {
                    i.wsStatus = strapi.serverStatus[i._id].ws.readyState;
                } else {
                    i.wsStatus = WebSocket.CLOSED;
                }
            }
        }

        if (_.isArray(item)) {
            _.forEach(item, _appendSingle);
        } else {
            _appendSingle(item);
        }
    },
    async updateSocketPing(id) {
        let now = new Date();
        await strapi.models.server.updateOne({
            _id: id
        }, {
            lastSocketPing: now
        });
        return now;
    },
    async updatePing(id) {
        let now = new Date();
        await strapi.models.server.updateOne({
            _id: id
        }, {
            lastPing: now
        });
        return now;
    },
    async reloadServerStatus(cur) {
        let current = cur || {};
        let servers = await strapi.query('Server').find();
        let newservers = {};
        _.forEach(servers, s => {
            if (current[s._id]) {
                newservers[s._id] = new ServerStatus(current[s._id]);
                _.extend(newservers[s._id], _.pick(s, ['name', 'pingurl', 'lastPing', 'lastSocketPing', 'timeout', 'interval']));
            } else {
                newservers[s._id] = new ServerStatus(s);
            }
        });
        strapi.log.debug(`Reloaded status.`);
        return newservers;
    }
};
