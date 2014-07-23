/**
 * Creates a Fuel Cell box2d entity that is streamed to the clients
 * @type {*|void|Function}
 */
var Fuel = Box2DStreamEntity.extend({
    classId: 'Fuel',
    _$fuelLevel: 100,

    init: function (createData) {
        Box2DStreamEntity.prototype.init.call(this);

        this.category('fuel')
            .width(40)
            .height(40);

        this.box2dBody({
            type: 'static',
            allowSleep: true,
            fixtures: [
                {
                    filter: {
                        categoryBits: 0x0100,
                        maskBits: 0xffff
                    },
                    shape: {
                        type: 'rectangle'
                    }
                }
            ]
        });

        if (ige.isServer) {
            this.fuelBarX = createData.x;
            this.fuelBarY = createData.y;
            this.streamMode(1);
        } else {
            this.fuelBar = new IgeUiProgressBar()
                .max(100)
                .min(0)
                .width(40)
                .height(40)
                .barColor('#fc3a24')
                .barBorderColor("#4c7efc")
                .barBackColor("transparent")
                .mount(ige.client.objectScene)
                .depth(1)
                .progress(this._$fuelLevel)
                .rotateBy(0, 0, Math.radians(-90));

            if (createData) {
                this.fuelBar.translateTo(createData.x, createData.y, 0);
            }
        }

        this._$streamActionSections = ['updateFuelCellFuel'];
        this.streamSections(['transform'].concat(this._$streamActionSections));
    },

    /**
     * Updates the fuel level in the fuel cell and streams the new amount to the clients
     * Server Method
     * @param {Number} amount
     * @private
     */
    _$updateFuel: function (amount) {
        if (ige.isServer) {
            if (amount > 100) {
                amount = 100;
            } else if (amount < 0) {
                amount = 0;
            }

            this._$fuelLevel = amount;
            this.$addStreamData('updateFuelCellFuel', this._$fuelLevel, false);
        }
    },

    /**
     * Client event handler to update the fuel cell's level
     * @param amount
     * @private
     */
    _onFuelCellUpdateFuel: function (amount) {
        if (!ige.isServer) {
            this.fuelBar.progress(amount);
        }
    },

    /**
     * Takes fuel from the cell and returns the amount taken to the caller.
     * If there is no fuel to take, none will be given. If the amount requested
     * is more than the available fuel, the available fuel will be given.
     * Server Method
     * @param {Number} amount The amount of fuel to take
     * @returns {Number} The amount of fuel taken
     */
    $takeFuel: function (amount) {
        if (ige.isServer) {
            if (this._$fuelLevel > 5) {
                var fuelToTake = (amount < this._$fuelLevel) ? amount : this._$fuelLevel;
                this._$updateFuel(this._$fuelLevel - fuelToTake);
                return fuelToTake;
            }
            return 0;
        }
    },

    tick: function (ctx) {
        if (ige.isServer) {
            // Refill the fuel cell if the fuel is not full
            if (this._$fuelLevel < 100) {
                var newFuel;
                newFuel = this._$fuelLevel + 0.001 * ige._tickDelta;
                this._$updateFuel((newFuel > 100) ? 100 : newFuel);
            }
        }

        Box2DStreamEntity.prototype.tick.call(this, ctx);
    },

    _$handleCustomSectionData: function (sectionId, data) {
        switch (sectionId) {
        case 'updateFuelCellFuel':
            this._onFuelCellUpdateFuel(parseFloat(data));
            break;
        }
    },

    streamCreateData: function () {
        return {
            x: this.fuelBarX,
            y: this.fuelBarY
        };
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Fuel;
}