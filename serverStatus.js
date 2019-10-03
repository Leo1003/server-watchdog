const _ = require('lodash');

const ServerState = {
    UNKNOWN: 0,
    ONLINE: 1,
    WARNING: 2,
    DOWN: 3,
};

const PingStatus = {
    UNKNOWN: 0,
    LIVING: 1,
    EXPIRED: 2,
}

function stateToString(state) {
    switch (state) {
        case ServerState.DOWN:
            return "Down";
        case ServerState.WARNING:
            return "Warning";
        case ServerState.ONLINE:
            return "Online";
        default:
            return "Unknown";
    }
}


class ServerStatus {
    constructor(s) {
        _.extend(this, _.pick(s, ['id', 'name', 'pingurl', 'lastPing', 'lastSocketPing', 'timeout', 'interval']));

        this.ws = s.ws;
        this.needNotify = s.needNotify || false;
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
        let oldStatus = this.status;
        this.status = this._calStatus();

        if (this.status === ServerState.DOWN && oldStatus !== ServerState.DOWN) {
            this.needNotify = true;
        }
        if (this.status !== ServerState.DOWN) {
            this.needNotify = false;
        }
        return this.status;
    }

    setNotified() {
        this.needNotify = false;
    }

    printState() {
        return `${this.name}: ${stateToString(this.status)}\n`;
    }

    _calStatus() {
        let wsexp = this._socketStatus();
        let urlexp = this._urlStatus();
        if (wsexp !== PingStatus.UNKNOWN && urlexp !== PingStatus.UNKNOWN) {
            if (wsexp === PingStatus.LIVING && urlexp === PingStatus.LIVING) {
                return ServerState.ONLINE;
            } else if (wsexp === PingStatus.LIVING || urlexp === PingStatus.LIVING) {
                return ServerState.WARNING;
            } else {
                return ServerState.DOWN;
            }
        } else if (wsexp !== PingStatus.UNKNOWN) {
            if (wsexp === PingStatus.LIVING) {
                return ServerState.ONLINE;
            } else {
                return ServerState.DOWN;
            }
        } else if (urlexp !== PingStatus.UNKNOWN) {
            if (urlexp === PingStatus.LIVING) {
                return ServerState.ONLINE;
            } else {
                return ServerState.DOWN;
            }
        } else {
            return ServerState.UNKNOWN;
        }
    }
    _socketStatus() {
        let now = new Date();
        if (this.lastSocketPing) {
            if ((now - this.lastSocketPing) > (this.timeout * 1000)) {
                return PingStatus.EXPIRED;
            } else {
                return PingStatus.LIVING;
            }
        } else {
            return PingStatus.UNKNOWN;
        }
    }
    _urlStatus() {
        let now = new Date();
        if (this.lastPing) {
            if ((now - this.lastPing) > (this.timeout * 1000)) {
                return PingStatus.EXPIRED;
            } else {
                return PingStatus.LIVING;
            }
        } else {
            return PingStatus.UNKNOWN;
        }
    }
}

module.exports = {
    ServerState,
    ServerStatus,
};
