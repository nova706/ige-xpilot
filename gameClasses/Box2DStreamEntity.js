/**
 * Creates a streamed box2d entity
 * @type {*|void|Function}
 */
var Box2DStreamEntity = IgeEntityBox2d.extend({
    classId: 'Box2DStreamEntity',
    _$streamActions: {},
    _$streamActionSections: [],

    init: function (createData) {
        IgeEntityBox2d.prototype.init.call(this);
        this.streamSections(['transform'].concat(this._$streamActionSections));
    },

    /**
     * Override
     * Sets the data to be streamed to the client on creation of the streamed entity
     * @returns {Object}
     */
    streamCreateData: function() {
        return {};
    },

    /**
     * Adds data to be streamed to the client
     * @param {String} id A string identifying the action section
     * @param {String|Object|Array|Number|Boolean} data The data to be streamed.
     * @param {Boolean} keepOld Per default this method overrides previously set
     * data before the actual stream happened (the stream action data is emptied
     * everytime the data was gathered, i.e. after every data stream). If you want
     * the commands to stack up and not only one but all of them should be streamed,
     * use "keepOld".
     */
    $addStreamData: function (id, data, keepOld) {
        if (keepOld === true && typeof(this._$streamActions[id]) == 'object') {
            this._$streamActions[id].push(data);
        } else {
            this._$streamActions[id] = [data];
        }
    },

    /**
     * Override this method to handle custom stream section data
     * @param {String} sectionId
     * @param {String|Number|Boolean|Object|Array} data
     */
    _$handleCustomSectionData: function (sectionId, data) {
        /*switch (sectionId) {
        case 'updatePlayerFuel':
            ige.$(data.clientId)._onPlayerUpdateFuel(parseFloat(data.fuel), data.fuelCellId);
            break;
        case 'togglePlayerThrust':
            ige.$(data.clientId)._onTogglePlayerThrust(data.enabled);
            break;
        }*/
    },

    /**
     * Override
     * Called to stream data to the client. Overridden to allow handling custom stream data
     * @param {String} sectionId The ID of the stream
     * @param {String|Number|Boolean|Object|Array} data The data to be streamed
     * @param {Boolean} bypassTimeStream
     * @returns {*}
     */
    streamSectionData: function (sectionId, data, bypassTimeStream) {
        if (this._$streamActionSections.indexOf(sectionId) != -1) {
            if (!data) {
                if (ige.isServer) {
                    return this._$getJSONStreamActionData(sectionId);
                } else {
                    return;
                }
            }
            var dataArr = JSON.parse(data);
            var dataId;
            for (dataId in dataArr) {
                if (dataArr.hasOwnProperty(dataId)) {
                    this._$handleCustomSectionData(sectionId, dataArr[dataId]);
                }
            }
        } else {
            return IgeEntityBox2d.prototype.streamSectionData.call(this, sectionId, data, bypassTimeStream);
        }
    },

    /**
     * Return a stringified version of a streamAction property
     * @param {String} property A string identifying the action section
     * @return {String} JSON string or undefined
     */
    _$getJSONStreamActionData: function (property) {
        if (this._$streamActions.hasOwnProperty(property) && this._$streamActions[property] != undefined) {
            var data = this._$streamActions[property];
            delete this._$streamActions[property];
            return JSON.stringify(data);
        }
    }
});

if (typeof(module) !== 'undefined' && typeof(module.exports) !== 'undefined') {
    module.exports = Box2DStreamEntity;
}