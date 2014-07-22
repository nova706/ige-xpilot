/**
 * Creates a landing pad for the players to land on and respawn to.
 * Only one player may claim and respawn to a landing pad.
 * @type {*|void|Function}
 */
var LandingPad = IgeEntityBox2d.extend({
    classId: 'LandingPad',
    $isOccupied: false,

    init: function () {
        IgeEntityBox2d.prototype.init.call(this);

        this.category('landingPad')
            .width(40)
            .height(3);

        if (ige.isServer) {
            this.box2dBody({
                type: 'static',
                allowSleep: true,
                fixtures: [
                    {
                        filter: {
                            categoryBits: 0x0002,
                            maskBits: 0xffff
                        },
                        shape: {
                            type: 'rectangle'
                        }
                    }
                ]
            });
            this.streamMode(1);
        } else {
            this._rectColor = '#ffffff';
            this.texture(ige.client.textures.rectangle);
            this.depth(2);
        }
    },

    /**
     * Sets the landing pad as occupied.
     */
    $occupy: function () {
        this.$isOccupied = true;
    },

    /**
     * Sets the landing pad as unoccupied
     */
    $unOccupy: function () {
        this.$isOccupied = false;
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = LandingPad;
}