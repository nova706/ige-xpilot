/**
 * Generates the scenes
 */
var SceneGenerator = {

    buildScene: function () {
        this.mainScene = new IgeScene2d()
            .id('mainScene');

        this.objectScene = new IgeScene2d()
            .id('objectScene')
            .mount(this.mainScene);

        this.vp1 = new IgeViewport()
            .id('vp1')
            .autoSize(true)
            .scene(this.mainScene)
            .drawBounds(false)
            .drawBoundsData(true)
            .mount(ige);

        if (!ige.isServer) {
            this.uiScene = new IgeScene2d()
                .id('uiScene')
                .ignoreCamera(true)
                .depth(10)
                .mount(this.mainScene);

            this.backScene = new IgeScene2d()
                .id('backScene')
                .translateTo(27, 17, 0)
                .backgroundPattern(ige.client.textures.space, 'repeat', false, false)
                .mount(this.mainScene);

            // Create UI elements
            new IgeFontEntity()
                .texture(ige.client.textures.font)
                .width(100)
                .text('Score')
                .top(5)
                .right(10)
                .mount(this.uiScene);

            new IgeFontEntity()
                .id('scoreText')
                .texture(ige.client.textures.font)
                .width(100)
                .text('0 points')
                .colorOverlay('#ff6000')
                .top(35)
                .right(10)
                .mount(this.uiScene);

            new IgeFontEntity()
                .texture(ige.client.textures.font)
                .width(100)
                .text('Fuel Level')
                .top(80)
                .right(10)
                .mount(this.uiScene);

            // Define the player fuel bar
            new IgeUiProgressBar()
                .id('player_fuelBar')
                .max(100)
                .min(0)
                .right(10)
                .top(120)
                .width(100)
                .height(10)
                .barBackColor('#953800')
                .barColor('#ff6000')
                .mount(ige.client.uiScene);

        }
    }

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = SceneGenerator;
}