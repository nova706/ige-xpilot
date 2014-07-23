/**
 * Creates a player box2d entity that is streamed to the clients
 * @type {*|void|Function}
 */
var Player = Box2DStreamEntity.extend({
    classId: 'Player',
    _$thrustPower: 1,
    _$fuelLevel: 100,
    _$fuelEntity: null,
    _$score: 0,
    _$isCrashed: false,
    _$canFire: true,
    _$fireDelay: 100,
    $hasShield: false,
    _fuelRopeEntity: null,
    _countDownText: null,
    _thrusting: false,

    init: function (createData) {
        Box2DStreamEntity.prototype.init.call(this);
        var self = this;

        this._resetControls();

        self.category('ship')
            .width(20)
            .height(20);

        this.addComponent(IgeVelocityComponent);

        // Define the polygon for collision
        var triangles,
            fixDefs,
            collisionPoly = new IgePoly2d()
                .addPoint(0, -this._geometry.y2)
                .addPoint(this._geometry.x2, this._geometry.y2)
                .addPoint(0, this._geometry.y2 - 5)
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
                    categoryBits: 0x0004,
                    maskBits: 0xffff & ~0x0008
                },
                shape: {
                    type: 'polygon',
                    data: this.triangles[i]
                }
            });
        }

        // Add a sensor to the fixtures so we can detect
        // when the ship is near a fuel cell
        fixDefs.push({
            density: 0.0,
            friction: 0.0,
            restitution: 0.0,
            isSensor: true,
            filter: {
                categoryBits: 0x0008,
                maskBits: 0x0100
            },
            shape: {
                type: 'circle',
                data: {
                    radius: 60
                }
            }
        });

        // Setup the box2d physics properties
        self.box2dBody({
            type: 'dynamic',
            linearDamping: 0.0,
            angularDamping: 0.5,
            allowSleep: true,
            bullet: true,
            gravitic: true,
            fixedRotation: false,
            fixtures: fixDefs
        });

        this.frontPoint = new IgeEntity()
            .translateTo(0, -18, 0)
            .width(2)
            .height(2)
            .mount(this);

        this.homeBase = ige.$(createData.homeBaseId);
        if (this.homeBase) {
            this.homeBase.$occupy();
        }

        if (ige.isServer) {
            this.id(createData.id);
            //this.addBehaviour('control_behaviour', this._behaviour);

            this.$hasShield = createData.hasShield;
            if (this.$hasShield) {
                this.$toggleShield(true, 5000);
            }

        } else {
            self.texture(ige.client.textures.ship);
            self.depth(3);

            // Add a particle emitter for the thrust particles
            self.thrustEmitter = new IgeParticleEmitter()
                .particle(ThrustParticle)
                .lifeBase(300)
                .quantityBase(60)
                .quantityTimespan(1000)
                .deathOpacityBase(0)
                .velocityVector(new IgePoint(0, 0.05, 0), new IgePoint(-0.04, 0.05, 0), new IgePoint(0.04, 0.15, 0))
                .particleMountTarget(ige.client.objectScene)
                .translateTo(0, 5, 0)
                .mount(self);

            self.shield = new Shield()
                .mount(this);

            if (!createData.hasShield) {
                self.shield.hide();
            }
        }

        this.goToBase();

        this._$streamActionSections = ['updatePlayerFuel'];
        this.streamSections(['transform'].concat(this._$streamActionSections));
    },

    /**
     * Resets the active controls
     * @private
     */
    _resetControls: function () {
        this.controls = {
            left: false,
            right: false,
            thrust: false,
            shoot: false
        };
    },

    /**
     * Toggles the players shield
     * Server Method
     * @param {Boolean} enabled Whether or not the shield should be active
     * @param {Number} lifeSpan The length of time the shield should be active for
     */
    $toggleShield: function (enabled, lifeSpan) {
        if (ige.isServer) {
            this.$hasShield = enabled;
            ige.server.sendMessage('playerToggleShield', { clientId: this.id(), enabled: enabled });

            if (enabled && lifeSpan > 0) {
                var self = this;
                setTimeout(function () {
                    self.$toggleShield(false, 0);
                }, lifeSpan);
            }
        }
    },

    /**
     * Client event handler to show or hide a player's shield
     * @param {Boolean} enabled Whether or not the shield is active
     * @private
     */
    _onPlayerToggleShield: function (enabled) {
        if (!ige.isServer) {
            if (enabled) {
                this.shield.show();
            } else {
                this.shield.hide();
            }
        }
    },

    /**
     * Handler for when a user lands on a landing pad
     * Server Method
     * @param {LandingPad} landingPad The pad the user landed on
     */
    $land: function (landingPad) {
        this._box2dBody.SetAngularVelocity(0);
        this._box2dBody.SetLinearVelocity(new IgePoint(0, 0, 0));
        this.rotateTo(0, 0, 0);
    },

    /**
     * Repositions the player to their claimed landing pad
     */
    goToBase: function () {
        if (this.homeBase) {
            this._box2dBody.SetAngularVelocity(0);
            this._box2dBody.SetLinearVelocity(new IgePoint(0, 0, 0));
            this.rotateTo(0, 0, 0);
            this.translateTo(this.homeBase._translate.x, this.homeBase._translate.y - 5, 0);
        }
    },

    /**
     * Updates a player's score and streams the new score to the client
     * Server Method
     * @param {Number} score
     * @private
     */
    _$updateScore: function (score) {
        if (ige.isServer) {
            if (score < 0) {
                score = 0;
            }
            this._$score = score;
            ige.server.sendMessage('playerUpdateScore', { clientId: this.id(), score: score });
        }
    },

    /**
     * Increments or decrements a player's score by a given amount
     * Server Method
     * @param {Number} score If positive, increments the player's score, if negative, decrements the player's score
     */
    $adjustScore: function (score) {
        if (ige.isServer) {
            this._$updateScore(this._$score + score);
        }
    },

    /**
     * Client event handler for updating a players score and rendering a score marker
     * @param {Number} newScore
     * @private
     */
    _onPlayerUpdateScore: function (newScore) {
        if (!ige.isServer && this.id() === ige.client.playerId) {
            new ClientScore(newScore - ige.client.score)
                .translateTo(this._translate.x, this._translate.y + 50, 0)
                .mount(ige.client.objectScene)
                .start();

            ige.client.updateScore(newScore);
        }
    },

    /**
     * Updates a player's fuel level. This method is streamed to the client
     * Server Method
     * @param {Number} amount The new fuel level
     * @private
     */
    _$updateFuel: function (amount) {
        if (ige.isServer) {
            if (this._$isCrashed) {
                return;
            }
            if (amount > 100) {
                amount = 100;
            } else if (amount < 0) {
                amount = 0;
            }
            this._$fuelLevel = amount;

            var fuelEntityId = (this._$fuelEntity) ? this._$fuelEntity.id() : null;
            this.$addStreamData('updatePlayerFuel', { fuel: this._$fuelLevel, fuelCellId: fuelEntityId }, false);
        }
    },

    /**
     * Client event handler for when a player's fuel lis updated. This handler updates
     * the fuel bar for the current user and manages fuel rope entities.
     * @param {Number} amount The player's new amount of fuel
     * @param {String} fuelCellId The id of the fuel cell that providing fuel. Used to build the fuel ropes
     * @private
     */
    _onPlayerUpdateFuel: function (amount, fuelCellId) {
        if (!ige.isServer) {

            if (this.id() === ige.client.playerId) {
                ige.$('player_fuelBar').progress(amount);
            }

            if (fuelCellId) {
                var self = this;
                var fuelCell = ige.$(fuelCellId);
                if (fuelCell) {
                    if (this._fuelRopeEntity) {
                        this._fuelRopeEntity.delayDeath();
                    } else {
                        this._fuelRopeEntity = new FuelRope(fuelCell, this, function () {
                            self._fuelRopeEntity = null;
                        }).mount(ige.client.objectScene);
                    }
                }
            }
        }
    },

    /**
     * Causes the ship to start taking fuel from a fuel cell entity
     * Server Method
     * @param fuelEntity
     */
    $startFueling: function (fuelEntity) {
        if (ige.isServer && fuelEntity) {
            if (this._$isCrashed || this._$fuelEntity) {
                return;
            }
            this._$fuelEntity = fuelEntity;
        }
    },

    /**
     * Causes the ship to stop taking fuel from a fuel cell entity
     * Server Method
     */
    $stopFueling: function () {
        if (ige.isServer) {
            this._$fuelEntity = null;
        }
    },

    /**
     * Causes a player to crash and starts the respawn timer. This is streamed to the client for the explosion effect.
     * Server Method
     */
    $crash: function () {
        if (ige.isServer) {
            this._resetControls();
            this._box2dBody.SetAngularVelocity(0);
            this._box2dBody.SetLinearVelocity(new IgePoint(0, 0, 0));
            this.rotateTo(0, 0, 0);
            this.unMount();
            this._box2dBody.SetAwake(false);
            this._box2dBody.SetActive(false);
            var self = this;
            setTimeout(function () {
                self.$respawn();
            }, 3000);

            ige.server.sendMessage('playerCrash', self.id());

            this._$isCrashed = true;
        }
    },

    /**
     * Client event handler for when a player crashes. This creates the explosion effect and displays the respawn timer
     * @private
     */
    _onPlayerCrash: function () {
        if (!ige.isServer) {
            this._resetControls();

            if (this._fuelRopeEntity) {
                this._fuelRopeEntity.destroy();
            }

            // Use a timer to acount for render delay
            var self = this;
            setTimeout(function () {
                self.unMount();
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
                    .translateTo(self._translate.x, self._translate.y, 0)
                    .start();

                // Create a count down at the death location
                if (self.id() === ige.client.playerId) {
                    self._countDownText = new ClientCountDown('Respawn in ', 3, 's', 1000)
                        .translateTo(self._translate.x, self._translate.y, 0)
                        .mount(ige.client.objectScene)
                        .start();
                }
            }, 80);
        }
    },

    /**
     * Causes a player to respawn at their home base. Streamed to the client to re mount the client entity.
     * Server Method
     */
    $respawn: function () {
        if (ige.isServer) {
            this._resetControls();
            this._$isCrashed = false;

            this._$updateFuel(100);
            this._box2dBody.SetActive(true);
            this._box2dBody.SetAngularVelocity(0);
            this._box2dBody.SetLinearVelocity(new IgePoint(0, 0, 0));
            this.goToBase();
            this.$toggleShield(true, 5000);

            // Reset player transform
            this.rotateTo(0, 0, 0);
            this.mount(ige.server.objectScene);

            ige.server.sendMessage('playerRespawn', this.id());
        }
    },

    /**
     * Client event handler for when a player respawns. This remounts the player to the client scene.
     * @private
     */
    _onPlayerRespawn: function () {
        if (!ige.isServer) {
            this._resetControls();
            if (this._countDownText) {
                this._countDownText.destroy();
                this._countDownText = null;
            }
            var self = this;
            setTimeout(function () {
                self.mount(ige.client.objectScene);
            }, 200);
        }
    },

    /**
     * This fires a bullet from the player's ship. The rate of fire is controlled via a timer.
     * Server Method
     */
    $shoot: function () {
        if (ige.isServer) {
            var self = this;
            if (this._$isCrashed) {
                return;
            }
            if (this._$canFire) {
                this._$canFire = false;
                setTimeout(function () {
                    self._$canFire = true;
                }, this._$fireDelay);
                var radians = this._rotate.z + Math.radians(-90);
                var mountPoint = this.frontPoint.aabb();
                new Bullet(this)
                    .translateTo(mountPoint.x, mountPoint.y, 0)
                    .mount(ige.server.objectScene)
                    .$fire(radians);

            }
        }
    },

    /**
     * Starts the player's thrust. This is streamed to the client to show the thrust particle emitter.
     * Server Method
     * @private
     */
    _$startThrust: function () {
        if (ige.isServer && !this.$_thrusting) {
            this.$_thrusting = true;
            ige.server.sendMessage('playerThrustStart', this.id());
        }
    },

    /**
     * Stops the player's thrust. This is streamed to the client to hide the thrust particle emitter.
     * Server Method
     * @private
     */
    _$stopThrust: function () {
        if (ige.isServer && this.$_thrusting) {
            this.$_thrusting = false;
            ige.server.sendMessage('playerThrustStop', this.id());
        }
    },

    /**
     * Client event handler for when a player's thrust is toggled either starting or stopping the particle emitter.
     * @param {Boolean} enabled
     * @private
     */
    _onTogglePlayerThrust: function (enabled) {
        if (!ige.isServer) {
            if (enabled && !this._thrusting) {
                // Enable the particle emitter
                this.thrustEmitter.start();
                this._thrusting = true;
            } else if (!enabled && this._thrusting) {
                // Disable the particle emitter
                this.thrustEmitter.stop();
                this._thrusting = false;
            }
        }
    },

    tick: function (ctx) {
        if (ige.isServer) {

            if (!this._$isCrashed) {

                if ((this.controls.left && this.controls.right) || (!this.controls.left && !this.controls.right)) {
                    this._box2dBody.SetAngularVelocity(0);
                } else if (this.controls.right) {
                    this._box2dBody.SetAngularVelocity(5);
                } else if (this.controls.left) {
                    this._box2dBody.SetAngularVelocity(-5);
                }

                if (this.controls.shoot) {
                    this.$shoot();
                }

                if (this.controls.thrust && this._$fuelLevel > 0) {
                    var radians = this._rotate.z + Math.radians(-90);
                    var thrustVector = new ige.box2d.b2Vec2(Math.cos(radians) * this._$thrustPower, Math.sin(radians) * this._$thrustPower);

                    this._box2dBody.ApplyForce(thrustVector, this._box2dBody.GetWorldCenter());
                    this._box2dBody.SetAwake(true);
                    this._$updateFuel(this._$fuelLevel - 0.005 * ige._tickDelta);
                    this._$startThrust();
                } else {
                    this._$stopThrust();
                }

                if (this._$fuelEntity && this._$fuelLevel < 100) {
                    this._$updateFuel(this._$fuelLevel + this._$fuelEntity.$takeFuel(0.01 * ige._tickDelta));
                }
            }

        }

        Box2DStreamEntity.prototype.tick.call(this, ctx);
    },

    destroy: function () {

        // Un-occupy the home base
        if (this.homeBase) {
            this.homeBase.$unOccupy();
        }

        // Destroy any linked fuel rope
        if (this._fuelRopeEntity) {
            this._fuelRopeEntity.destroy();
        }

        Box2DStreamEntity.prototype.destroy.call(this);
    },

    // TODO: Touch Control Behavior
    _behaviour: function (ctx) {

        /*if(!ige.isServer) {
         if(!this.movement.vector.compare(this.controller.movement.vector)) {
         this.movement.id = this.controller.movement.id;
         this.movement.vector = this.controller.movement.vector.clone();
         ige.network.send('playerMove', [this.movement.id, this.movement.vector.x, this.movement.vector.y]);
         }
         if(!this.aiming.vector.compare(this.controller.aiming.vector)) {
         this.aiming.id = this.controller.aiming.id;
         this.aiming.vector = this.controller.aiming.vector.clone();
         ige.network.send('playerAim', [this.aiming.id, this.aiming.vector.x, this.aiming.vector.y]);
         }
         if(this.firing != this.controller.firing) {
         this.firing = this.controller.firing;
         ige.network.send('playerFire', [this.firing,this.aiming.id,this.aiming.vector.x,this.aiming.vector.y]);
         }
         }*/

    },

    _$handleCustomSectionData: function (sectionId, data) {
        switch (sectionId) {
        case 'updatePlayerFuel':
            this._onPlayerUpdateFuel(parseFloat(data.fuel), data.fuelCellId);
            break;
        }
    },

    /**
     * Override
     * Sets the data to be streamed to the client on creation of the streamed entity
     * @returns {{id: String, hasShield: Boolean}}
     */
    streamCreateData: function () {
        return {
            id: this.id(),
            hasShield: this.$hasShield,
            homeBaseId: this.homeBase.id()
        };
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Player;
}