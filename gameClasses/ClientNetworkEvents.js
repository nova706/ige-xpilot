/**
 * Router for client events
 */
var ClientNetworkEvents = {
    /**
     * Is called when a network packet with the "playerEntity" command
     * is received by the client from the server. This is the server telling
     * us which entity is our player entity so that we can track it with
     * the main camera
     * @param data The data object that contains any data sent from the server.
     * @private
     */
    _onPlayerEntity: function (data) {
        if (ige.$(data)) {
            ige.client.vp1.camera.trackTranslate(ige.$(data), 20);
        } else {
            // The client has not yet received the entity via the network
            // stream so lets ask the stream to tell us when it creates a
            // new entity and then check if that entity is the one we
            // should be tracking
            var self = this;
            self._eventListener = ige.network.stream.on('entityCreated', function (entity) {
                if (entity.id() === data) {
                    // Tell the camera to track out player entity
                    ige.client.vp1.camera.trackTranslate(ige.$(data), 20);
                    ige.client.playerId = entity.id();

                    /*entity.addComponent(TouchControllerComponent,{
                     scene: ige.client.uiScene,
                     movement: true,
                     aiming: false,
                     controller_texture: ige.client.textures.controller,
                     controller_stick_texture: ige.client.textures.controller_stick,
                     events: false
                     });*/

                    // Turn off the listener for this event now that we
                    // have found and started tracking our player entity
                    ige.network.stream.off('entityCreated', self._eventListener, function (result) {
                        if (!result) {
                            this.log('Could not disable event listener!', 'warning');
                        }
                    });
                }
            });
        }
    },

    _onPlayerThrustStart: function (clientId) {
        ige.$(clientId)._onTogglePlayerThrust(true);
    },

    _onPlayerThrustStop: function (clientId) {
        ige.$(clientId)._onTogglePlayerThrust(false);
    },

    _onPlayerCrash: function (clientId) {
        ige.$(clientId)._onPlayerCrash();
    },

    _onPlayerRespawn: function (clientId) {
        ige.$(clientId)._onPlayerRespawn();
    },

    _onPlayerToggleShield: function (data) {
        var player = ige.$(data.clientId);
        if (player) {
            player._onPlayerToggleShield(data.enabled);
        }
    },

    _onPlayerUpdateScore: function (data) {
        ige.$(data.clientId)._onPlayerUpdateScore(data.score);
    }
};

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') {
    module.exports = ClientNetworkEvents;
}