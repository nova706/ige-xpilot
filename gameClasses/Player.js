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

        this._$streamActionSections = ['updatePlayerPhysics'];
        this.streamSections(['transform'].concat(this._$streamActionSections));

        if (ige.isServer) {
            this.id(createData.id);
            this.streamSyncInterval(500, 'updatePlayerPhysics');
        } else {
            this.texture(ige.client.textures.ship);
            this.depth(3);

            // Add a particle emitter for the thrust particles
            this.thrustEmitter = new IgeParticleEmitter()
                .particle(ThrustParticle)
                .lifeBase(300)
                .quantityBase(60)
                .quantityTimespan(1000)
                .deathOpacityBase(0)
                .velocityVector(new IgePoint(0, 0.05, 0), new IgePoint(-0.04, 0.05, 0), new IgePoint(0.04, 0.15, 0))
                .particleMountTarget(ige.client.objectScene)
                .translateTo(0, 5, 0)
                .mount(this);

            this.shield = new Shield().mount(this);

            if (!createData.hasShield) {
                this.shield.hide();
            }
        }

        this._resetControls();

        this.category('ship')
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
        this.box2dBody({
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

        this.$hasShield = createData.hasShield;
        if (this.$hasShield) {
            this.toggleShield(true, 5000);
        }

        this.goToBase();

        /*this._$streamActionSections = ['updatePlayerFuel'];
        this.streamSections(['transform'].concat(this._$streamActionSections));*/
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
     * @param {Boolean} enabled Whether or not the shield should be active
     * @param {Number} lifeSpan The length of time the shield should be active for
     */
    toggleShield: function (enabled, lifeSpan) {
        if (ige.isServer || ige.client.playingLocally) {

            this._onPlayerToggleShield(enabled);

            if (ige.isServer) {
                ige.server.sendMessage('playerToggleShield', { clientId: this.id(), enabled: enabled });
            }

            if (enabled && lifeSpan > 0) {
                var self = this;
                setTimeout(function () {
                    self.toggleShield(false, 0);
                }, lifeSpan);
            }
        }
    },

    /**
     * Handler to show or hide a player's shield
     * @param {Boolean} enabled Whether or not the shield is active
     * @private
     */
    _onPlayerToggleShield: function (enabled) {
        this.$hasShield = enabled;

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
     * @param {LandingPad} landingPad The pad the user landed on
     */
    land: function (landingPad) {
        this._resetEntityPhysics();
    },

    /**
     * Repositions the player to their claimed landing pad
     */
    goToBase: function () {
        if (this.homeBase) {
            this._resetEntityPhysics();
            this.translateTo(this.homeBase._translate.x, this.homeBase._translate.y - 5, 0);
        }
    },

    /**
     * Updates a player's score and streams the new score to the client
     * @private
     * @param {Number} score
     */
    _updateScore: function (score) {
        if (ige.isServer || ige.client.playingLocally) {
            if (score < 0) {
                score = 0;
            }

            this._onPlayerUpdateScore(score);

            if (ige.isServer) {
                ige.server.sendMessage('playerUpdateScore', { clientId: this.id(), score: score });
            }
        }
    },

    /**
     * Increments or decrements a player's score by a given amount
     * @param {Number} score If positive, increments the player's score, if negative, decrements the player's score
     */
    adjustScore: function (score) {
        this._updateScore(this._$score + score);
    },

    /**
     * Handler for updating a players score and rendering a score marker
     * @param {Number} newScore
     * @private
     */
    _onPlayerUpdateScore: function (newScore) {
        this._$score = newScore;

        if (!ige.isServer && this.id() === ige.client.playerId) {
            new ClientScore(newScore - ige.client.score)
                .translateTo(this._translate.x, this._translate.y + 50, 0)
                .mount(ige.client.objectScene)
                .start();

            ige.client.updateScore(newScore);
        }
    },

    /**
     * Updates a player's fuel level.
     * @param {Number} amount The new fuel level
     * @private
     */
    _updateFuel: function (amount) {
        if (ige.isServer || this.id() === ige.client.playerId) {
            if (this._$isCrashed) {
                return;
            }
            if (amount > 100) {
                amount = 100;
            } else if (amount < 0) {
                amount = 0;
            }
            this._$fuelLevel = amount;

            if (amount === 100) {
                this.stopFueling();
            }

            if (!ige.isServer) {
                ige.$('player_fuelBar').progress(amount);
            }
        }
    },

    /**
     * Causes the ship to start taking fuel from a fuel cell entity
     * @param fuelCell
     */
    startFueling: function (fuelCell) {
        if (fuelCell && !this._$isCrashed && !this._$fuelEntity) {
            this._$fuelEntity = fuelCell;
            if (!ige.isServer) {
                this._fuelRopeEntity = new FuelRope(fuelCell, this).mount(ige.client.objectScene);
            }
        }
    },

    /**
     * Causes the ship to stop taking fuel from a fuel cell entity
     */
    stopFueling: function () {
        this._$fuelEntity = null;
        if (this._fuelRopeEntity) {
            this._fuelRopeEntity.destroy();
            delete this._fuelRopeEntity;
        }
    },

    _resetEntityPhysics: function () {
        this._resetControls();
        this._box2dBody.SetAngularVelocity(0);
        this._box2dBody.SetLinearVelocity(new IgePoint(0, 0, 0));
        this.rotateTo(0, 0, 0);
    },

    /**
     * Causes a player to crash and starts the respawn timer.
     * An event from the server is passed to the clients to allow rendering of other player's crashes.
     */
    crash: function () {
        if (ige.isServer || ige.client.playingLocally) {
            var self = this;
            setTimeout(function () {
                self.respawn();
            }, 3000);

            this._onPlayerCrash();

            if (ige.isServer) {
                ige.server.sendMessage('playerCrash', this.id());
            }
        }
    },

    /**
     * Handler for when a player crashes. This creates the explosion effect and displays the respawn timer.
     * @private
     */
    _onPlayerCrash: function () {
        this._$isCrashed = true;

        this._resetEntityPhysics();
        this._box2dBody.SetAwake(false);
        this._box2dBody.SetActive(false);

        if (this._fuelRopeEntity) {
            this._fuelRopeEntity.destroy();
        }

        this._displayRespawnTimer();
        this._renderExplosion();

        this.unMount();
    },

    /**
     * Client method to render respawn countdown at the ship's location.
     * @private
     */
    _displayRespawnTimer: function () {
        if (!ige.isServer && this.id() === ige.client.playerId) {
            // Create a count down at the death location
            this._countDownText = new ClientCountDown('Respawn in ', 3, 's', 1000)
                .translateTo(this._translate.x, this._translate.y, 0)
                .mount(ige.client.objectScene)
                .start();
        }
    },

    /**
     * Client method to render an explosion at the ship's location.
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
     * Causes a player to respawn at their home base. Streamed to the client to re mount the client entity.
     */
    respawn: function () {
        if (ige.isServer || ige.client.playingLocally) {
            this._onPlayerRespawn();

            if (ige.isServer) {
                ige.server.sendMessage('playerRespawn', this.id());
            }
        }
    },

    /**
     * Handler for when a player respawns.
     * @private
     */
    _onPlayerRespawn: function () {
        this._$isCrashed = false;

        if (this._countDownText) {
            this._countDownText.destroy();
            this._countDownText = null;
        }

        this._resetControls();
        this._updateFuel(100);
        this.toggleShield(true, 5000);
        this.goToBase();
        this._box2dBody.SetActive(true);

        if (ige.isServer) {
            this.mount(ige.server.objectScene);
        } else {
            this.mount(ige.client.objectScene);
        }
    },

    /**
     * This fires a bullet from the player's ship. The rate of fire is controlled via a timer.
     */
    shoot: function () {
        if (ige.isServer || ige.client.playingLocally) {
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
                var bullet = new Bullet({ shooter: this.id(), radians: radians, mountX: mountPoint.x, mountY: mountPoint.y });
            }
        }
    },

    /**
     * Client method to toggle a ship's thrust either starting or stopping the particle emitter.
     * @private
     * @param {Boolean} enabled
     */
    _togglePlayerThrust: function (enabled) {
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

    update: function (ctx) {
        if (!this._$isCrashed) {

            if ((this.controls.left && this.controls.right) || (!this.controls.left && !this.controls.right)) {
                this._box2dBody.SetAngularVelocity(0);
            } else if (this.controls.right) {
                this._box2dBody.SetAngularVelocity(5);
            } else if (this.controls.left) {
                this._box2dBody.SetAngularVelocity(-5);
            }

            if (this.controls.shoot) {
                this.shoot();
            }

            if (this.controls.thrust && this._$fuelLevel > 0) {
                var radians = this._rotate.z + Math.radians(-90);
                var thrustVector = new ige.box2d.b2Vec2(Math.cos(radians) * this._$thrustPower, Math.sin(radians) * this._$thrustPower);

                this._box2dBody.ApplyForce(thrustVector, this._box2dBody.GetWorldCenter());
                this._box2dBody.SetAwake(true);
                this._updateFuel(this._$fuelLevel - 0.005 * ige._tickDelta);
                this._togglePlayerThrust(true);
            } else {
                this._togglePlayerThrust(false);
            }

            if (this._$fuelEntity && this._$fuelLevel < 100) {
                this._updateFuel(this._$fuelLevel + this._$fuelEntity.takeFuel(0.01 * ige._tickDelta));
            }
        }

        if (ige.isServer) {
            var linearVelocity = this._box2dBody.m_linearVelocity;
            this.$addStreamData('updatePlayerPhysics', linearVelocity, false);
        }

        Box2DStreamEntity.prototype.update.call(this, ctx);
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

    _updateClientPhysics: function (data) {
        if (!ige.isServer && !ige.client.playingLocally) {
            this._box2dBody.SetLinearVelocity(new IgePoint(parseFloat(data.x), parseFloat(data.y), 0));
        }
    },

    _$handleCustomSectionData: function (sectionId, data) {
        // TODO: Verify fuel levels
        switch (sectionId) {
        /*case 'updatePlayerFuel':
            ige.$(data.clientId)._onPlayerUpdateFuel(parseFloat(data.fuel), data.fuelCellId);
            break;*/
        case 'updatePlayerPhysics':
            this._updateClientPhysics(data);
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

    /**
     * Override
     * Called to stream data to the client. Overridden to allow handling of the client player's position
     * @param {String} sectionId The ID of the stream
     * @param {String|Number|Boolean|Object|Array} data The data to be streamed
     * @param {Boolean} bypassTimeStream
     * @returns {*}
     */
    /*streamSectionData: function (sectionId, data, bypassTimeStream) {

        // If the position data sent by the server is for the current player, only validate that the position is correct.
        if (!ige.isServer && sectionId === 'transform' && this.id() === ige.client.playerId) {
            // TODO: Handle the stream data from the server here. We currently
            //console.log('Handling Stream Data', data);
        }

        return IgeEntityBox2d.prototype.streamSectionData.call(this, sectionId, data, bypassTimeStream);
    }*/
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Player;
}