const _ = require('lodash');

const ServerState = {
    UNKNOWN: 0,
    ONLINE: 1,
    WARNING: 2,
    DOWN: 3,
};

class ServerStatus {
    constructor(s) {
        _.extend(this, _.pick(s, ['id', 'name', 'pingurl', 'lastPing', 'lastSocketPing', 'timeout', 'interval']));

        this.ws = s.ws;
        //this.lastNotified = s.lastNotified;
        this.status = s.status || ServerState.UNKNOWN;
        this.refreshStatus();
    }

    async urlPong() {
        let time = await strapi.services.server.updatePing(this.id);
        this.lastPing = time;
        this.status = this._calStatus();
    }

    async socketPong() {
        let time = await strapi.services.server.updateSocketPing(this.id);
        this.lastSocketPing = time;
        this.status = this._calStatus();
    }

    needUrlPing() {
        if (!this.lastPing) {
            return true;
        }
        return (new Date() - this.lastPing) > (this.interval * 1000);
    }

    needSocketPing() {
        if (!this.lastSocketPing) {
            return true;
        }
        return (new Date() - this.lastSocketPing) > (this.interval * 1000);
    }

    refreshStatus() {
        if (!this.lastPing && !this.lastSocketPing) {
            this.status = ServerState.UNKNOWN;
        } else {
            this.status = this._calStatus();
        }
        return this.status;
    }
    _calStatus() {
        let wsexp = this._isSocketExpired();
        let urlexp = this._isUrlExpired();
        if (wsexp && urlexp) {
            return ServerState.DOWN;
        } else if (wsexp || urlexp) {
            return ServerState.WARNING;
        } else {
            return ServerState.ONLINE;
        }
    }
    _isSocketExpired() {
        let now = new Date();
        if (this.lastSocketPing) {
            return (now - this.lastSocketPing) > (this.timeout * 1000);
        }
        return false;
    }
    _isUrlExpired() {
        let now = new Date();
        if (this.lastPing) {
            return (now - this.lastPing) > (this.timeout * 1000);
        }
        return false;
    }
}

module.exports = {
    ServerState,
    ServerStatus,
};
