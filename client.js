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
        self.textures.ship = new IgeTexture('./assets/Ship.js');
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

        // Enable networking
        ige.addComponent(IgeNetIoComponent);

        // Implement our game methods
        this.implement(ClientNetworkEvents);

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
                    // Start the networking (you can do this elsewhere if it
                    // makes sense to connect to the server later on rather
                    // than before the scene etc are created... maybe you want
                    // a splash screen or a menu first? Then connect after you've
                    // got a username or something?
                    // TODO: Create a splash screen for setting the server location for testing. Localhost works fine for local testing but using the IP
                    // TODO: address, you can test multiplayer as well
                    ige.network.start('http://localhost:2000', function () {

                        ige.network.define('playerEntity', self._onPlayerEntity);
                        ige.network.define('playerThrustStart', self._onPlayerThrustStart);
                        ige.network.define('playerThrustStop', self._onPlayerThrustStop);
                        ige.network.define('playerCrash', self._onPlayerCrash);
                        ige.network.define('playerRespawn', self._onPlayerRespawn);
                        ige.network.define('playerToggleShield', self._onPlayerToggleShield);
                        ige.network.define('playerUpdateScore', self._onPlayerUpdateScore);

                        // Setup the network stream handler
                        ige.network.addComponent(IgeStreamComponent)
                            .stream.renderLatency(80); // Render the simulation 160 milliseconds in the past

                        // TODO: Move scene creation to another class file
                        self.mainScene = new IgeScene2d()
                            .id('mainScene');

                        self.objectScene = new IgeScene2d()
                            .id('objectScene')
                            .mount(self.mainScene);

                        self.uiScene = new IgeScene2d()
                            .id('uiScene')
                            .ignoreCamera(true)
                            .depth(10)
                            .mount(self.mainScene);

                        self.backScene = new IgeScene2d()
                            .id('backScene')
                            .mount(self.mainScene);

                        // Create UI elements
                        new IgeFontEntity()
                            .texture(ige.client.textures.font)
                            .width(100)
                            .text('Score')
                            .top(5)
                            .right(10)
                            .mount(self.uiScene);

                        new IgeFontEntity()
                            .id('scoreText')
                            .texture(ige.client.textures.font)
                            .width(100)
                            .text('0 points')
                            .colorOverlay('#ff6000')
                            .top(35)
                            .right(10)
                            .mount(self.uiScene);

                        new IgeFontEntity()
                            .texture(ige.client.textures.font)
                            .width(100)
                            .text('Fuel Level')
                            .top(80)
                            .right(10)
                            .mount(self.uiScene);

                        // Define the player fuel bar
                        new IgeUiProgressBar()
                            .id('player_fuelBar')
                            .max(100)
                            .min(0)
                            .right(10)
                            .top(120)
                            //.translateTo(0, -25, 0)
                            .width(100)
                            .height(10)
                            .barBackColor('#953800')
                            .barColor('#ff6000')
                            .mount(ige.client.uiScene);

                        // Create the main viewport and set the scene
                        // it will "look" at as the new scene1 we just
                        // created above
                        self.vp1 = new IgeViewport()
                            .id('vp1')
                            .autoSize(true)
                            .scene(self.mainScene)
                            .drawBounds(false)
                            .drawBoundsData(true)
                            .mount(ige);

                        // TODO: Move map creation to another class file
                        // TODO: Change Gravity based on map
                        ige.box2d._world.m_gravity = {
                            x: 0,
                            y: 0
                        };

                        // Load the Tiled map data and handle the return data
                        // TODO: Move the space layer as a background to the object scene rather than part of the map.
                        ige.addComponent(IgeTiledComponent)
                            .tiled.loadJson(Map1, function (layerArray, layersById) {
                                var i;

                                for (i = 0; i < layerArray.length; i++) {
                                    layerArray[i]
                                        .tileWidth(40)
                                        .tileHeight(40)
                                        .autoSection(20)
                                        .drawBounds(false)
                                        .drawBoundsData(false)
                                        .mount(self.backScene);
                                }
                            });

                        // Define our player controls
                        ige.input.mapAction('left', ige.input.key.left);
                        ige.input.mapAction('right', ige.input.key.right);
                        ige.input.mapAction('thrust', ige.input.key.up);
                        ige.input.mapAction('shoot', ige.input.key.space);

                        // Ask the server to create an entity for us
                        ige.network.send('playerEntity');

                        ige.network.debugMax(10);
                        ige.network.debug(true);
                    });
                }
            });
        });
    },

    updateScore: function (newScore) {
        this.score = newScore;
        ige.$('scoreText').text(this.score + ' points');
    }
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') {
    module.exports = Client;
}