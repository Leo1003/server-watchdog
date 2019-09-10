'use strict';
const _ = require('lodash');
const WebSocket = require('ws');

module.exports = strapi => {
    const hook = {
        /**
         * Default options
         */
        defaults: {},

        /**
         * Initialize the hook
         */
        initialize() {
            let wss = new WebSocket.Server({ noServer: true });
            wss.on('connection', (ws, request, serverData) => {
                ws.serverId = serverData.id;
                strapi.serverStatus[serverData.id].ws = ws;
                ws.ping();
                ws.on('pong', () => {
                    strapi.log.trace(`Received pong from server: ${serverData.name}`);
                    strapi.serverStatus[serverData.id].socketPong().then(() => {
                        strapi.log.trace(`WebSocket pong completed.`);
                    });
                });
                ws.on('close', (code, reason) => {
                    if (strapi.serverStatus[serverData.id]) {
                        strapi.serverStatus[serverData.id].ws = undefined;
                    }
                });
            });

            strapi.server.on('upgrade', (request, socket, head) => {
                hook.authenticate(request).then(serverData => {
                    strapi.log.debug(`serverData: ${serverData}`);
                    if (!serverData) {
                        socket.destroy();
                        return;
                    }
                    strapi.log.info(`Server connected: ${serverData.name}`);
                    wss.handleUpgrade(request, socket, head, ws => {
                        wss.emit('connection', ws, request, serverData);
                    });
                }).catch(err => {
                    socket.destroy();
                });
            });
            strapi.wss = wss;
        },
        authenticate: async req => {
            strapi.log.trace(`Connect with header: ${req.headers.authorization}`);
            let token = req.headers.authorization.split(' ');
            if (token[0] !== 'Bearer' || token.length != 2) {
                throw new Error('Invalid Authorization token');
            }
            strapi.log.trace(`Token: ${token[1]}`);
            return await strapi.models.server.findOne({ token: token[1] });
        }
    };

    return hook;
};
