/**
 * Creates a bullet box2d entity that is streamed to the clients
 * @type {*|void|Function}
 */
var Bullet = Box2DStreamEntity.extend({
    classId: 'Bullet',
    _$velocity: 800,
    _$lifeSpan: 1500,

    init: function (player) {
        Box2DStreamEntity.prototype.init.call(this);

        this.category('bullet')
            .width(4)
            .height(4);

        this._rectColor = '#ffffff';

        if (ige.isServer) {
            this._shooter = player;
            this.lifeSpan(this._$lifeSpan);
            this.box2dBody({
                type: 'dynamic',
                linearDamping: 0.0,
                angularDamping: 0.0,
                allowSleep: true,
                bullet: true,
                gravitic: false,
                fixedRotation: false,
                fixtures: [
                    {
                        filter: {
                            categoryBits: 0x0102,
                            maskBits: 0xffff & ~0x0008 & ~0x0102
                        },
                        shape: {
                            type: 'rectangle'
                        }
                    }
                ]
            }).streamMode(1);

        } else {
            this.texture(ige.client.textures.rectangle);
        }
    },

    /**
     * Fires a bullet at a trajectory based on the given radians
     * Server Method
     * @param {Number} radians
     */
    $fire: function (radians) {
        if (ige.isServer) {
            var vector = new ige.box2d.b2Vec2(Math.cos(radians) * this._$velocity, Math.sin(radians) * this._$velocity);
            this._box2dBody.SetAngularVelocity(0);
            this._box2dBody.SetAwake(true);
            this._box2dBody.ApplyForce(vector, this._box2dBody.GetWorldCenter());
        }
    }
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') {
    module.exports = Bullet;
}