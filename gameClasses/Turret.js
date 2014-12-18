/**
 * Creates a turret box2d entity that is streamed to the clients
 * @type {*|void|Function}
 */
var Turret = IgeEntityBox2d.extend({
    classId: 'Turret',
    _$isKilled: false,
    _$canFire: true,
    _$fireDelay: 1000,
    _$respawnDelay: 20000,
    _$maxFireAngle: 60,
    _$sensorRange: 400,

    init: function () {
        IgeEntityBox2d.prototype.init.call(this);

        this.category('turret')
            .width(40)
            .height(20);

        // Define the polygon for collision
        var triangles,
            fixDefs,
            collisionPoly = new IgePoly2d()
                .addPoint(0, -this._geometry.y2)
                .addPoint(this._geometry.x2, this._geometry.y2)
                .addPoint(-this._geometry.x2, this._geometry.y2);

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
                    radius: this._$sensorRange
                }
            }
        });

        // Setup the box2d physics properties
        this.box2dBody({
            type: 'static',
            allowSleep: true,
            fixtures: fixDefs
        });

        this.frontPoint = new IgeEntity()
            .translateTo(0, -18, 0)
            .width(2)
            .height(2)
            .mount(this);

        if (ige.isServer) {
            this.streamMode(1);
            this.streamSyncInterval(500);
        } else {
            this.texture(ige.client.textures.turret);
            this.depth(3);
        }
    },

    /**
     * Causes a turret to be "killed" and starts the respawn timer.
     */
    kill: function () {
        if (!this._$isKilled && (ige.isServer || ige.client.playingLocally)) {
            this.stopShooting();

            var self = this;
            setTimeout(function () {
                self.respawn();
            }, this._$respawnDelay);

            this._onTurretKilled();

            if (ige.isServer) {
                ige.server.sendMessage('turretKilled', self.id());
            }
        }
    },

    /**
     * Handler for when a turret is killed. This creates the explosion effect and displays the respawn timer
     * @private
     */
    _onTurretKilled: function () {
        this._$isKilled = true;
        this.unMount();
        this._box2dBody.SetAwake(false);
        this._box2dBody.SetActive(false);
        this._renderExplosion();
    },

    /**
     * Client method to render an explosion at the turret's location.
     * @private
     */
    _renderExplosion: function () {
        if (!ige.isServer) {
            new IgeParticleEmitter()
                .particle(ExplosionParticle)
                .lifeBase(500)
                .quantityBase(100)
                .quantityTimespan(150)
                .deathOpacityBase(0)
                .velocityVector(new IgePoint(0, 0, 0), new IgePoint(-0.1, -0.1, 0), new IgePoint(0.1, 0.1, 0))
                .linearForceVector(new IgePoint(0, 0, 0))
                .particleMountTarget(ige.client.objectScene)
                .lifeSpan(150)
                .mount(ige.client.objectScene)
                .translateTo(this._translate.x, this._translate.y, 0)
                .start();
        }
    },

    /**
     * Causes a turret to respawn.
     */
    respawn: function () {
        if (ige.isServer || ige.client.playingLocally) {
            this._onTurretRespawn();

            if (ige.isServer) {
                ige.server.sendMessage('turretRespawn', this.id());
            }
        }
    },

    /**
     * Handler for when a turret respawns. This remounts the turret to the client scene.
     * @private
     */
    _onTurretRespawn: function () {
        this._$isKilled = false;
        this._box2dBody.SetActive(true);

        if (ige.isServer) {
            this.mount(ige.server.objectScene);
        } else {
            this.mount(ige.client.objectScene);
        }
    },

    _fireBullet: function () {
        // Use a random trajectory for the bullet
        var max = this._$maxFireAngle;
        var min = -this._$maxFireAngle;
        var radians = this._rotate.z + Math.radians(Math.random() * (max - min) + min - 90);
        var mountPoint = this.frontPoint.aabb();
        var bullet = new Bullet({shooter: this.id(), radians: radians, mountX: mountPoint.x, mountY: mountPoint.y });
    },

    /**
     * This starts firing bullets from the turret. The rate of fire is controlled via a timer.
    */
    startShooting: function () {
        if (ige.isServer || ige.client.playingLocally) {
            if (this._$isKilled || this._$fireInterval) {
                return;
            }
            var self = this;
            this._$fireInterval = setInterval(function () {
                self._fireBullet();
            }, this._$fireDelay);
        }
    },

    /**
     * This starts firing bullets from the turret. The rate of fire is controlled via a timer.
     */
    stopShooting: function () {
        if (ige.isServer || ige.client.playingLocally) {
            clearInterval(this._$fireInterval);
            this._$fireInterval = 0;
        }
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Turret;
}