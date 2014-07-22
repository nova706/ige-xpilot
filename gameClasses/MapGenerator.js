/**
 * Generates maps based on JSON data
 */
var MapGenerator = {

    buildMap: function (data) {

        this.landingPads = [];

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
        var turretLayer;
        var turretDirection;
        for (i = 0; i < data.layers.length; i++) {
            switch (data.layers[i].name) {
            case 'landing':
                landingLayer = data.layers[i];
                break;
            case 'walls':
                wallLayer = data.layers[i];
                break;
            case 'fuel':
                fuelLayer = data.layers[i];
                break;
            case 'turrets':
                turretLayer = data.layers[i];
                break;
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
                        .mount(this.objectScene);

                }
            }
        }

        // This entity type is streamed so do not create it on the client
        if (ige.isServer && landingLayer) {
            for (i = 0; i < landingLayer.data.length; i++) {
                if (landingLayer.data[i] !== 0) {
                    y = Math.floor(i / 40);
                    x = i % 40;
                    x = x * 40;
                    y = y * 40;
                    y -= 20;
                    landingPad = new LandingPad()
                        .translateTo(x, y, 0)
                        .mount(this.objectScene);

                    this.landingPads.push(landingPad);
                }
            }
        }

        // This entity type is streamed so do not create it on the client
        if (ige.isServer && fuelLayer) {
            for (i = 0; i < fuelLayer.data.length; i++) {
                if (fuelLayer.data[i] !== 0) {
                    y = Math.floor(i / 40);
                    x = i % 40;
                    x = x * 40;
                    y = y * 40;
                    new Fuel({ x: x, y: y})
                        .translateTo(x, y, 0)
                        .mount(this.objectScene);
                }
            }
        }

        // This entity type is streamed so do not create it on the client
        if (ige.isServer && turretLayer) {
            for (i = 0; i < turretLayer.data.length; i++) {
                if (turretLayer.data[i] !== 0) {
                    y = Math.floor(i / 40);
                    x = i % 40;
                    x = x * 40;
                    y = y * 40;

                    switch (turretLayer.data[i]) {
                    case 10:
                        turretDirection = 270; // West
                        x += 10;
                        break;
                    case 11:
                        turretDirection = 0; // North
                        y += 10;
                        break;
                    case 12:
                        turretDirection = 180; //South
                        y -= 10;
                        break;
                    case 13:
                        turretDirection = 90; // East
                        x -= 10;
                        break;
                    default:
                        turretDirection = 0;
                    }

                    new Turret()
                        .translateTo(x, y, 0)
                        .rotateTo(0, 0, Math.radians(turretDirection))
                        .mount(this.objectScene);
                }
            }
        }
    }

};

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = MapGenerator;
}