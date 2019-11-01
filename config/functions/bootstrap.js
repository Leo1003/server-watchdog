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

module.exports = async () => {
    axios.defaults.timeout = 1500;
    let startTimestamp = new Date();

    let result = await strapi.services.server.reloadServerStatus();
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
                        strapi.log.warn(`Pinging '${err.request.url}' with returned status code: ${err.response.status}`);
                        s.urlPong().then(() => {
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

            s.refreshStatus();
            // Start to notify after 15 seconds
            let now = new Date();
            if (s.needNotify && (now - startTimestamp > 15000)) {
                if (s.status === ServerState.DOWN) {
                    strapi.log.warn(`Server '${s.name}' went down!`);
                    strapi.hook.tgbot.sendMessage(`!!!Server Watchdog Warning!!!\nServer '${s.name}' went down!\nPlease check your server's status.`).then(result => {
                        s.setNotified();
                        if (!_.isNull(result)) {
                            strapi.log.info(`Notify sent successfully.`);
                        }
                    }).catch(err => {
                        strapi.log.error(`Error when sending notify: ${err}`);
                    });
                } else if (s.status === ServerState.ONLINE) {
                    strapi.log.info(`Server '${s.name}' recovered!`);
                    strapi.hook.tgbot.sendMessage(`---Server Watchdog Notifiy---\nServer '${s.name}' is up!`).then(result => {
                        s.setNotified();
                        if (!_.isNull(result)) {
                            strapi.log.info(`Notify sent successfully.`);
                        }
                    }).catch(err => {
                        strapi.log.error(`Error when sending notify: ${err}`);
                    });
                } else if (s.status === ServerState.WARNING) {
                    strapi.log.info(`Server '${s.name}' recovered but one of the ping method is failed!`);
                    strapi.hook.tgbot.sendMessage(`---Server Watchdog Notifiy---\nServer '${s.name}' is up!\nBut one of the ping method(URL/WebSocket) is failed!`).then(result => {
                        s.setNotified();
                        if (!_.isNull(result)) {
                            strapi.log.info(`Notify sent successfully.`);
                        }
                    }).catch(err => {
                        strapi.log.error(`Error when sending notify: ${err}`);
                    });
                } else {
                    strapi.log.error(`Unknown state ${s.printState()}!`);
                    strapi.log.error(`Cannot send notify...`);
                    s.setNotified();
                }
            }
        });
    }, 2000);
};
