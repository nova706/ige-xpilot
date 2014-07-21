var Server = IgeClass.extend({
    classId: 'Server',
    Server: true,

    // TODO: Break this out into separate methods
    init: function () {
        var self = this;
        ige.timeScale(1);

        // Define an object to hold references to our player entities
        this.players = {};
        this.landingPads = [];
        this.messagesSending = {};

        // Add the server-side game methods / event handlers
        this.implement(ServerNetworkEvents);

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

                        // Add the network stream component
                        ige.network.addComponent(IgeStreamComponent)
                            .stream.sendInterval(30) // Send a stream update once every 30 milliseconds
                            .stream.start(); // Start the stream

                        // Accept incoming network connections
                        ige.network.acceptConnections(true);

                        // TODO: Move scene creation to another class file
                        self.mainScene = new IgeScene2d()
                            .id('mainScene');

                        self.objectScene = new IgeScene2d()
                            .id('objectScene')
                            .mount(self.mainScene);

                        // Create the main viewport and set the scene
                        // it will "look" at as the new scene1 we just
                        // created above
                        self.vp1 = new IgeViewport()
                            .id('vp1')
                            .autoSize(true)
                            .scene(self.mainScene)
                            .mount(ige);

                        // TODO: Move map creation logic to a separate class file
                        // TODO: Change Gravity based on map
                        ige.box2d._world.m_gravity = {
                            x: 0,
                            y: 0
                        };

                        var i;
                        var x;
                        var y;
                        var wallLayer;
                        var wallType;
                        var landingLayer;
                        var landingPad;
                        var fuelLayer;
                        for (i = 0; i < Map1.layers.length; i++) {
                            if (Map1.layers[i].name === 'landing') {
                                landingLayer = Map1.layers[i];
                            }
                            if (Map1.layers[i].name === 'walls') {
                                wallLayer = Map1.layers[i];
                            }
                            if (Map1.layers[i].name === 'fuel') {
                                fuelLayer = Map1.layers[i];
                            }
                        }

                        if (landingLayer) {
                            for (i = 0; i < landingLayer.data.length; i++) {
                                if (landingLayer.data[i] !== 0) {
                                    y = Math.floor(i / 40);
                                    x = i % 40;
                                    x = x * 40;
                                    y = y * 40;
                                    y -= 20;
                                    landingPad = new LandingPad()
                                        .translateTo(x, y, 0)
                                        .mount(self.objectScene);

                                    self.landingPads.push(landingPad);
                                }
                            }
                        }

                        if (wallLayer) {
                            for (i = 0; i < wallLayer.data.length; i++) {
                                if (wallLayer.data[i] !== 0) {
                                    y = Math.floor(i / 40);
                                    x = i % 40;
                                    x = x * 40;
                                    y = y * 40;

                                    switch (wallLayer.data[i]) {
                                    case 6:
                                        wallType = 'box';
                                        break;
                                    case 5:
                                        wallType = 'tl';
                                        break;
                                    case 4:
                                        wallType = 'tr';
                                        break;
                                    case 3:
                                        wallType = 'br';
                                        break;
                                    case 2:
                                        wallType = 'bl';
                                        break;
                                    }

                                    new Wall(wallType)
                                        .translateTo(x, y, 0)
                                        .mount(self.objectScene);

                                }
                            }
                        }

                        if (fuelLayer) {
                            for (i = 0; i < fuelLayer.data.length; i++) {
                                if (fuelLayer.data[i] !== 0) {
                                    y = Math.floor(i / 40);
                                    x = i % 40;
                                    x = x * 40;
                                    y = y * 40;
                                    new Fuel({ x: x, y: y})
                                        .translateTo(x, y, 0)
                                        .mount(self.objectScene);
                                }
                            }
                        }

                        // TODO: Move collision detection logic into another class file
                        ige.box2d.contactListener(
                            // Listen for when contact's begin
                            function (contact) {

                                if (contact.igeBothCategories('ship')) {
                                    var player1 = contact.igeEntityByCategory('ship');
                                    var player2 = contact.igeOtherEntity(player1);
                                    if (!player1.$hasShield) {
                                        player1.$crash();
                                    }
                                    if (!player2.$hasShield) {
                                        player2.$crash();
                                    }
                                } else if (contact.igeEitherCategory('ship')) {
                                    var player = contact.igeEntityByCategory('ship');
                                    // If the player ship touches a landing pad, check velocity and angle
                                    var degrees = Math.degrees(player._rotate.z),
                                        wound = Math.round(degrees / 360);

                                    if (wound > 0) {
                                        degrees -= (360 * wound);
                                    }

                                    if (wound < 0) {
                                        degrees -= (360 * wound);
                                    }

                                    var velocity = Math.abs(contact.m_fixtureA.m_body.m_linearVelocity.x) + Math.abs(contact.m_fixtureA.m_body.m_linearVelocity.y);
                                    var maxWoundVelocity = 18;
                                    var minWoundVelocity = 10;

                                    if (contact.igeEitherCategory('bullet')) {
                                        if (player._hasShield) {
                                            contact.SetEnabled(false);
                                        } else {
                                            var shooter = contact.igeEntityByCategory('bullet')._shooter;
                                            if (shooter) {
                                                shooter.$adjustScore(100);
                                            }
                                            player.$crash();
                                        }
                                    } else if (contact.igeEitherCategory('wall_box') || contact.igeEitherCategory('fuel')) {
                                        player._rotate.z = Math.radians(degrees);

                                        var contactRight = contact.m_manifold.m_localPlaneNormal.x === -1;
                                        var contactLeft = contact.m_manifold.m_localPlaneNormal.x === 1;
                                        var contactTop = contact.m_manifold.m_localPlaneNormal.y === 1;
                                        var contactBottom = contact.m_manifold.m_localPlaneNormal.y === -1;

                                        if (velocity > maxWoundVelocity) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && contactBottom && (degrees > 45 || degrees < -45)) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && contactTop && (degrees > -135 || degrees < -225) && (degrees > 225 || degrees < 135)) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && contactLeft && (degrees > 135 || degrees < 45)) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && contactRight && (degrees > -45 || degrees < -135)) {
                                            player.$crash();
                                        }
                                    } else if (contact.igeEitherCategory('wall_br')) {
                                        player._rotate.z = Math.radians(degrees);
                                        if (velocity > maxWoundVelocity) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && (degrees > 0 || degrees < -90)) {
                                            player.$crash();
                                        }
                                    } else if (contact.igeEitherCategory('wall_bl')) {
                                        player._rotate.z = Math.radians(degrees);
                                        if (velocity > maxWoundVelocity) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && (degrees > 90 || degrees < 0)) {
                                            player.$crash();
                                        }
                                    } else if (contact.igeEitherCategory('wall_tl')) {
                                        player._rotate.z = Math.radians(degrees);
                                        if (velocity > maxWoundVelocity) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && (degrees > 180 || degrees < 90)) {
                                            player.$crash();
                                        }
                                    } else if (contact.igeEitherCategory('wall_tr')) {
                                        player._rotate.z = Math.radians(degrees);
                                        if (velocity > maxWoundVelocity) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && (degrees > -90 || degrees < -180)) {
                                            player.$crash();
                                        }
                                    } else if (contact.igeEitherCategory('landingPad')) {

                                        // Rotate the player to land on the surface
                                        player._rotate.z = Math.radians(degrees);

                                        if (velocity > maxWoundVelocity) {
                                            player.$crash();
                                        } else if (velocity > minWoundVelocity && (degrees > 45 || degrees < -45)) {
                                            player.$crash();
                                        } else if (degrees < 45 || degrees > -45) {
                                            var landingPad = contact.igeEntityByCategory('landingPad');
                                            player.$land(landingPad);
                                        }
                                    }

                                    if (contact.igeEitherCategory('fuel') && !player._fueling) {
                                        player.$startFueling(contact.igeEntityByCategory('fuel'), contact);
                                    }
                                }

                                if (contact.igeEitherCategory('bullet')) {
                                    contact.igeEntityByCategory('bullet').destroy();
                                }
                            },
                            // Listen for when contact's end
                            function (contact) {
                                if (contact.igeEitherCategory('fuel') && contact.igeEitherCategory('ship')) {
                                    // Check if it is our sensor
                                    if (contact.m_fixtureA.IsSensor() || contact.m_fixtureB.IsSensor()) {
                                        // Sensor has disconnected
                                        contact.igeEntityByCategory('ship').$stopFueling();
                                    }
                                }
                            }
                        );
                    }
                });
            });
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
    },

    /**
     * Returns a random unoccupied landing pad in the map
     * @returns {LandingPad}
     */
    getRandomPad: function () {
        var openPads = [];
        var i;
        for (i = 0; i < this.landingPads.length; i++) {
            if (!this.landingPads[i].$isOccupied) {
                openPads.push(this.landingPads[i]);
            }
        }
        if (openPads.length > 0) {
            return openPads[Math.floor(Math.random() * openPads.length)];
        }

        return null;
    }
});

if (typeof (module) !== 'undefined' && typeof( module.exports) !== 'undefined') {
    module.exports = Server;
}