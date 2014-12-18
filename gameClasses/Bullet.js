/**
 * Creates a bullet box2d entity that is streamed to the clients
 * @type {*|void|Function}
 */
var Bullet = Box2DStreamEntity.extend({
    classId: 'Bullet',
    _$velocity: 800,
    _$lifeSpan: 1500,
    $shooter: null,

    init: function (createData) {
        Box2DStreamEntity.prototype.init.call(this);

        this.category('bullet')
            .width(4)
            .height(4);

        this.$shooter = createData.shooter || null;
        this.$mountPoint = {
            x: createData.mountX,
            y: createData.mountY
        };
        this.$radians = createData.radians;
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
        });

        if (ige.isServer) {
            this.streamMode(1);
            //this.streamSyncInterval(16);
            this.mount(ige.server.objectScene);
        } else {
            this._rectColor = '#ffffff';
            this.texture(ige.client.textures.rectangle);
            this.mount(ige.client.objectScene);
        }

        this.translateTo(createData.mountX, createData.mountY, 0);

        var vector = new ige.box2d.b2Vec2(Math.cos(createData.radians) * this._$velocity, Math.sin(createData.radians) * this._$velocity);
        this._box2dBody.SetAngularVelocity(0);
        this._box2dBody.SetAwake(true);
        this._box2dBody.ApplyForce(vector, this._box2dBody.GetWorldCenter());
    },

    destroy: function () {
        delete this.$shooter;
        Box2DStreamEntity.prototype.destroy.call(this);
    },

    /**
     * Override
     * Sets the data to be streamed to the client on creation of the streamed entity
     * @returns {{id: String, hasShield: Boolean}}
     */
    streamCreateData: function () {
        return {
            shooter: this.$shooter,
            radians: this.$radians,
            mountX: this.$mountPoint.x,
            mountY: this.$mountPoint.y
        };
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Bullet;
}