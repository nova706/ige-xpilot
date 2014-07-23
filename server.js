var Server = IgeClass.extend({
    classId: 'Server',
    Server: true,

    // TODO: Break this out into separate methods
    init: function () {
        var self = this;
        ige.timeScale(1);

        // Define an object to hold references to our player entities
        this.players = {};
        this.messagesSending = {};

        // Add the server-side game methods / event handlers
        this.implement(ServerNetworkEvents);
        this.implement(SceneGenerator);
        this.implement(MapGenerator);

        ige.addComponent(IgeBox2dComponent)
            .box2d.sleep(true)
            .box2d.gravity(0, 1)
            .box2d.createWorld()
            .box2d.mode(0)
            .box2d.start();

        // Add the networking component
        ige.addComponent(IgeNetIoComponent)
            .network.start(2000, function () {
                ige.start(function (success) {
                    if (success) {
                        ige.network.define('playerEntity', self._onPlayerEntity);
                        ige.network.on('connect', self._onPlayerConnect);
                        ige.network.on('disconnect', self._onPlayerDisconnect);

                        ige.network.define('playerControlLeftDown', self._onPlayerLeftDown);
                        ige.network.define('playerControlRightDown', self._onPlayerRightDown);
                        ige.network.define('playerControlThrustDown', self._onPlayerThrustDown);
                        ige.network.define('playerControlShootDown', self._onPlayerShootDown);
                        ige.network.define('playerControlLeftUp', self._onPlayerLeftUp);
                        ige.network.define('playerControlRightUp', self._onPlayerRightUp);
                        ige.network.define('playerControlThrustUp', self._onPlayerThrustUp);
                        ige.network.define('playerControlShootUp', self._onPlayerShootUp);

                        // Client Events
                        ige.network.define('playerThrustStart');
                        ige.network.define('playerThrustStop');
                        ige.network.define('playerCrash');
                        ige.network.define('playerRespawn');
                        ige.network.define('playerToggleShield');
                        ige.network.define('playerUpdateScore');
                        ige.network.define('turretRespawn');
                        ige.network.define('turretKilled');

                        // Add the network stream component
                        ige.network.addComponent(IgeStreamComponent)
                            .stream.sendInterval(30) // Send a stream update once every 30 milliseconds
                            .stream.start(); // Start the stream

                        // Accept incoming network connections
                        ige.network.acceptConnections(true);

                        self.initializeWorld();
                    }
                });
            });
    },

    initializeWorld: function () {
        this.buildScene();
        this.buildMap(Map1);
        this.contactListener = new ContactListener();
    },

    /**
     * Sends a message to the client. This method sends a standard network message but protects against spamming.
     * A message of the same ID is only allowed to be sent once within a set interval.
     * @param {String} messageId
     */
    sendMessage: function (messageId) {
        var self = this;
        if (!this.messagesSending[messageId]) {
            ige.network.send.apply(ige.network, arguments);
            this.messagesSending[messageId] = true;
            setTimeout(function () {
                delete self.messagesSending[messageId];
            }, 320);
        }
    }
});

if (typeof (module) !== 'undefined' && typeof( module.exports) !== 'undefined') {
    module.exports = Server;
}