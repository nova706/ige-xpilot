var Client = IgeClass.extend({
    classId: 'Client',

    // TODO: Break this out into separate methods
    init: function () {
        ige.showStats(1);
        ige.input.debug(true);

        var self = this;
        self.obj = [];
        self.textures = {};
        self.textures.wall = {};
        self.landingPads = [];
        self.score = 0;

        // Load textures
        self.textures.space = new IgeTexture('./assets/space.png');
        self.textures.ship = new IgeTexture('./assets/Ship.js');
        self.textures.turret = new IgeTexture('./assets/Turret.js');
        self.textures.shield = new IgeTexture('./assets/Shield.js');
        self.textures.rectangle = new IgeTexture('./assets/Rectangle.js');
        self.textures.line = new IgeTexture('./assets/Line.js');
        self.textures.font = new IgeFontSheet('./assets/agency_fb_20pt.png', 3);
        self.textures.controller = new IgeTexture('./assets/Controller.js');
        self.textures.controller_stick = new IgeTexture('./assets/ControllerStick.js');
        self.textures.wall.box = new IgeTexture('./assets/walls/Box.js');
        self.textures.wall.tr = new IgeTexture('./assets/walls/TR.js');
        self.textures.wall.tl = new IgeTexture('./assets/walls/TL.js');
        self.textures.wall.bl = new IgeTexture('./assets/walls/BL.js');
        self.textures.wall.br = new IgeTexture('./assets/walls/BR.js');

        this.implement(MapGenerator);
        this.implement(SceneGenerator);

        // Add physics and setup physics world
        ige.addComponent(IgeBox2dComponent)
            .box2d.sleep(true)
            .box2d.gravity(0, 1)
            .box2d.createWorld()
            .box2d.mode(0)
            .box2d.start();

        // Create the HTML canvas
        ige.createFrontBuffer(true);

        // Wait for our textures to load before continuing
        ige.on('texturesLoaded', function () {

            // Start the engine
            ige.start(function (success) {
                // Check if the engine started successfully
                if (success) {

                    // Define our player controls
                    ige.input.mapAction('left', ige.input.key.left);
                    ige.input.mapAction('right', ige.input.key.right);
                    ige.input.mapAction('thrust', ige.input.key.up);
                    ige.input.mapAction('shoot', ige.input.key.space);

                    self.connectToServer();
                }
            });
        });
    },

    connectToServer: function (serverLocation) {

        // Enable networking
        ige.addComponent(IgeNetIoComponent);

        // Implement our game methods
        this.implement(ClientNetworkEvents);

        var self = this;
        serverLocation = serverLocation || 'http://localhost:2000';

        // Start the networking (you can do this elsewhere if it
        // makes sense to connect to the server later on rather
        // than before the scene etc are created... maybe you want
        // a splash screen or a menu first? Then connect after you've
        // got a username or something?
        // TODO: Create a splash screen for setting the server location for testing. Localhost works fine for local testing but using the IP
        // TODO: address, you can test multiplayer as well
        ige.network.start(serverLocation, function () {

            ige.network.define('playerEntity', self._onPlayerEntity);
            ige.network.define('playerCrash', self._onPlayerCrash);
            ige.network.define('playerRespawn', self._onPlayerRespawn);
            ige.network.define('playerToggleShield', self._onPlayerToggleShield);
            ige.network.define('playerUpdateScore', self._onPlayerUpdateScore);
            ige.network.define('playerThrustStart', self._onPlayerThrustStart);
            ige.network.define('playerThrustStop', self._onPlayerThrustStop);
            ige.network.define('turretRespawn', self._onTurretRespawn);
            ige.network.define('turretKilled', self._onTurretKilled);

            // Setup the network stream handler
            ige.network.addComponent(IgeStreamComponent)
                .stream.renderLatency(80); // Render the simulation 160 milliseconds in the past

            self.initializeWorld();

            // Ask the server to create an entity for us
            ige.network.send('playerEntity');

            ige.network.debugMax(10);
            ige.network.debug(true);
        });
    },

    initializeWorld: function () {
        this.buildScene();
        this.buildMap(Map1);
        this.contactListener = new ContactListener();
    },

    updateScore: function (newScore) {
        this.score = newScore;
        ige.$('scoreText').text(this.score + ' points');
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Client;
}