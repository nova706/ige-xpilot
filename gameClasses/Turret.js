/**
 * Creates a turret box2d entity that is streamed to the clients
 * @type {*|void|Function}
 */
var Turret = Box2DStreamEntity.extend({
    classId: 'Turret',
    _$isKilled: false,
    _$canFire: true,
    _$fireDelay: 1000,
    _$respawnDelay: 20000,
    _$maxFireAngle: 60,
    _$sensorRange: 400,

    init: function () {
        Box2DStreamEntity.prototype.init.call(this);
        var self = this;

        self.category('turret')
            .width(40)
            .height(20);

        if (ige.isServer) {
            this.streamMode(1);

            // Define the polygon for collision
            var triangles,
                fixDefs,
                collisionPoly = new IgePoly2d()
                    .addPoint(0, -this._bounds2d.y2)
                    .addPoint(this._bounds2d.x2, this._bounds2d.y2)
                    .addPoint(-this._bounds2d.x2, this._bounds2d.y2);

            // Scale the polygon by the box2d scale ratio
            collisionPoly.divide(ige.box2d._scaleRatio);

            // Now convert this polygon into an array of triangles
            triangles = collisionPoly.triangulate();
            this.triangles = triangles;

            // Create an array of box2d fixture definitions
            // based on the triangles
            fixDefs = [];

            var i;
            for (i = 0; i < this.triangles.length; i++) {
                fixDefs.push({
                    density: 1.0,
                    friction: 1.0,
                    restitution: 0.2,
                    filter: {
                        categoryBits: 0x0104,
                        maskBits: 0xffff
                    },
                    shape: {
                        type: 'polygon',
                        data: this.triangles[i]
                    }
                });
            }

            // Add a sensor to the fixtures so we can detect
            // when a ship is near the turret
            fixDefs.push({
                density: 0.0,
                friction: 0.0,
                restitution: 0.0,
                isSensor: true,
                filter: {
                    categoryBits: 0x0106,
                    maskBits: 0x0004
                },
                shape: {
                    type: 'circle',
                    data: {
                        radius: self._$sensorRange
                    }
                }
            });

            // Setup the box2d physics properties
            self.box2dBody({
                type: 'static',
                allowSleep: true,
                fixtures: fixDefs
            });

            this.frontPoint = new IgeEntity()
                .translateTo(0, -18, 0)
                .width(2)
                .height(2)
                .mount(this);

        } else {
            self.texture(ige.client.textures.turret);
            self.depth(3);

            this.frontPoint = new IgeEntity()
                .translateTo(0, -18, 0)
                .width(2)
                .height(2)
                .mount(this);
        }
    },

    /**
     * Causes a turret to be "killed" and starts the respawn timer. This is streamed to the client for the explosion effect.
     * Server Method
     */
    $kill: function () {
        if (ige.isServer && !this._$isKilled) {
            this.$stopShooting();
            this.unMount();
            this._box2dBody.SetAwake(false);
            this._box2dBody.SetActive(false);
            var self = this;
            setTimeout(function () {
                self.$respawn();
            }, this._$respawnDelay);

            ige.server.sendMessage('turretKilled', self.id());

            this._$isKilled = true;
        }
    },

    /**
     * Client event handler for when a turret is killed. This creates the explosion effect and displays the respawn timer
     * @private
     */
    _onTurretKilled: function () {
        if (!ige.isServer) {
            var self = this;
            setTimeout(function () {
                self.unMount();
                new IgeParticleEmitter()
                    .particle(ExplosionParticle)
                    .lifeBase(500)
                    .quantityBase(100)
                    .quantityTimespan(150)
                    .deathOpacityBase(0)
                    .velocityVector(new IgePoint2d(0, 0), new IgePoint2d(-0.1, -0.1), new IgePoint2d(0.1, 0.1))
                    .linearForceVector(new IgePoint2d(0, 0))
                    .particleMountTarget(ige.client.objectScene)
                    .lifeSpan(150)
                    .mount(ige.client.objectScene)
                    .translateTo(self._translate.x, self._translate.y, 0)
                    .start();
            }, 80);
        }
    },

    /**
     * Causes a player to respawn at their home base. Streamed to the client to remount the client entity.
     * Server Method
     */
    $respawn: function () {
        if (ige.isServer) {
            this._$isKilled = false;
            this._box2dBody.SetActive(true);

            // Reset player transform
            this._box2dBody.SetActive(true);
            this.mount(ige.server.objectScene);

            ige.server.sendMessage('turretRespawn', this.id());
        }
    },

    /**
     * Client event handler for when a turret respawns. This remounts the turret to the client scene.
     * @private
     */
    _onTurretRespawn: function () {
        if (!ige.isServer) {
            var self = this;
            setTimeout(function () {
                self.mount(ige.client.objectScene);
            }, 200);
        }
    },

    /**
     * This starts firing bullets from the turret. The rate of fire is controlled via a timer.
     * Server Method
     */
    $startShooting: function () {
        if (ige.isServer) {
            var self = this;
            if (this._$isKilled || this._$fireInterval) {
                return;
            }
            this._$fireInterval = setInterval(function () {

                // Use a random trajectory for the bullet
                var max = self._$maxFireAngle;
                var min = -self._$maxFireAngle;
                var radians = self._rotate.z + Math.radians(Math.random() * (max - min) + min - 90);
                var mountPoint = self.frontPoint.aabb();
                new Bullet(self)
                    .translateTo(mountPoint.x, mountPoint.y, 0)
                    .mount(ige.server.objectScene)
                    .$fire(radians);
            }, this._$fireDelay);
        }
    },

    /**
     * This starts firing bullets from the turret. The rate of fire is controlled via a timer.
     * Server Method
     */
    $stopShooting: function () {
        if (ige.isServer) {
            clearInterval(this._$fireInterval);
            this._$fireInterval = 0;
        }
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Turret;
}