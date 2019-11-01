'use strict';
const _ = require('lodash');

/**
 * Lifecycle callbacks for the `Server` model.
 */

module.exports = {
    // Before saving a value.
    // Fired before an `insert` or `update` query.
    // beforeSave: async (model) => {},

    // After saving a value.
    // Fired after an `insert` or `update` query.
    afterSave: async (model, result) => {
        strapi.log.trace('Saved!');
        strapi.serverStatus = await strapi.services.server.reloadServerStatus(strapi.serverStatus);
    },

    // Before fetching all values.
    // Fired before a `fetchAll` operation.
    // beforeFetchAll: async (model) => {},

    // After fetching all values.
    // Fired after a `fetchAll` operation.
    // afterFetchAll: async (model, results) => {},

    // Fired before a `fetch` operation.
    // beforeFetch: async (model) => {},

    // After fetching a value.
    // Fired after a `fetch` operation.
    // afterFetch: async (model, result) => {},

    // Before creating a value.
    // Fired before an `insert` query.
    beforeCreate: async (model) => {
        // Generate token for newly created items
        model.token = strapi.services.server.generateToken();
    },

    // After creating a value.
    // Fired after an `insert` query.
    // afterCreate: async (model, result) => {},

    // Before updating a value.
    // Fired before an `update` query.
    // beforeUpdate: async (model) => {},

    // After updating a value.
    // Fired after an `update` query.
    // afterUpdate: async (model, result) => {},

    // Before destroying a value.
    // Fired before a `delete` query.
    // beforeDestroy: async (model) => {},

    // After destroying a value.
    // Fired after a `delete` query.
    afterDestroy: async (model, result) => {
        strapi.log.trace('Destoried');
        if (!_.isNull(result)) {
            if (result.id && strapi.serverStatus[result.id] && strapi.serverStatus[result.id].ws) {
                strapi.log.info(`Closing websocket for ${result.name} due to server remove.`);
                strapi.serverStatus[result.id].ws.close(1000, 'Server Remove');
            }
            strapi.serverStatus = await strapi.services.server.reloadServerStatus(strapi.serverStatus);
        }
    }
};
