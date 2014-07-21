/**
 * Particle used in explosions
 * @type {*|void|Function}
 */
var ExplosionParticle = ThrustParticle.extend({
    classId: 'ExplosionParticle',

    init: function (emitter) {
        this._emitter = emitter;
        ThrustParticle.prototype.init.call(this);

        // Set the rectangle colour (this is read in the Rectangle.js smart texture)
        var pC = Math.floor(Math.random() * 3);
        if (pC === 0) {
            this._rectColor = '#ffffff';
        }
        if (pC === 1) {
            this._rectColor = '#eeeeee';
        }
        if (pC === 2) {
            this._rectColor = '#cccccc';
        }

        this.addComponent(IgeVelocityComponent)
            .texture(ige.client.textures.rectangle)
            .width(3)
            .height(3)
            .layer(1)
            .category('thrustParticle');
    },

    destroy: function () {
        // Remove ourselves from the emitter
        if (this._emitter !== undefined) {
            this._emitter._particles.pull(this);
        }
        ThrustParticle.prototype.destroy.call(this);
    }
});