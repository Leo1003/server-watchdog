'use strict';
const _ = require('lodash');
const axios = require('axios');
const {ServerState, ServerStatus} = require('../../serverStatus.js');

/**
 * An asynchronous bootstrap function that runs before
 * your application gets started.
 *
 * This gives you an opportunity to set up your data model,
 * run jobs, or perform some special logic.
 */

module.exports = cb => {
    strapi.services.server.reloadServerStatus().then(result => {
        strapi.log.debug(`Bootstrap loaded status object.`);
        strapi.serverStatus = result;
        setInterval(() => {
            _.forEach(strapi.serverStatus, (s, id) => {
                if (s.needUrlPing()) {
                    axios.get(s.pingurl).then(response => {
                        s.urlPong().then(() => {
                            strapi.log.trace(`URL pong completed.`);
                        });
                    }).catch(err => {
                        if (err.response) {
                            strapi.log.warn(`Pinging '${err.request.url}' with returned status code: ${error.response.status}`);
                            s.urlPong.then(() => {
                                strapi.log.trace(`URL pong completed.`);
                            });
                        }
                    });
                }
                if (s.needSocketPing()) {
                    if (s.ws) {
                        s.ws.ping();
                    }
                }
                let oldStatus = s.status;
                s.refreshStatus();
                if (s.status === ServerState.DOWN && oldStatus !== ServerState.DOWN) {
                    strapi.log.warn(`Server '${s.name}' went down!`);
                    //TODO: Send notify
                }
            });
        }, 2000);
    });
    axios.defaults.timeout = 1500;
    cb();
};
