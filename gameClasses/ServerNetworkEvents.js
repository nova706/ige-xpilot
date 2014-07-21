/**
 * Router for server events
 */
var ServerNetworkEvents = {
    /**
     * Is called when the network tells us a new client has connected
     * to the server. This is the point we can return true to reject
     * the client connection if we wanted to.
     * @private
     */
    _onPlayerConnect: function (socket) {
        // Don't reject the client connection
        return false;
    },

    _onPlayerDisconnect: function (clientId) {
        if (ige.server.players[clientId]) {
            // Remove the player from the game
            ige.server.players[clientId].destroy();

            // Remove the reference to the player entity
            delete ige.server.players[clientId];
        }
    },

    _onPlayerEntity: function (data, clientId) {
        if (!ige.server.players[clientId]) {
            var pad = ige.server.getRandomPad();

            if (!pad) {
                this.log('No Pads Available', 'error');
            }

            ige.server.players[clientId] = new Player({ id: clientId, homeBase: pad, hasShield: true })
                .streamMode(1)
                .mount(ige.server.objectScene);

            // Tell the client to track their player entity
            ige.network.send('playerEntity', ige.server.players[clientId].id(), clientId);
        }
    },

    _onPlayerLeftDown: function (data, clientId) {
        ige.server.players[clientId].controls.left = true;
    },

    _onPlayerLeftUp: function (data, clientId) {
        ige.server.players[clientId].controls.left = false;
    },

    _onPlayerRightDown: function (data, clientId) {
        ige.server.players[clientId].controls.right = true;
    },

    _onPlayerRightUp: function (data, clientId) {
        ige.server.players[clientId].controls.right = false;
    },

    _onPlayerThrustDown: function (data, clientId) {
        ige.server.players[clientId].controls.thrust = true;
    },

    _onPlayerThrustUp: function (data, clientId) {
        ige.server.players[clientId].controls.thrust = false;
    },

    _onPlayerShootDown: function (data, clientId) {
        ige.server.players[clientId].controls.shoot = true;
    },

    _onPlayerShootUp: function (data, clientId) {
        ige.server.players[clientId].controls.shoot = false;
    }
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') {
    module.exports = ServerNetworkEvents;
}