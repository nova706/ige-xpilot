/**
 * Creates a text element displaying a countdown
 * @type {*|void|Function}
 */
var ClientCountDown = IgeFontEntity.extend({
    classId: 'ClientCountDown',
    _count: 0,
    _prefix: '',
    _sufix: '',
    _interval: 1000,

    init: function (prefix, countdownFrom, sufix, interval) {
        IgeFontEntity.prototype.init.call(this);

        this._prefix = prefix || this._prefix;
        this._count = countdownFrom || this._count;
        this._sufix = sufix || this._sufix;
        this._interval = interval || this._interval;

        this.depth(4)
            .width(480)
            .height(110)
            .texture(ige.client.textures.font)
            .textAlignX(1)
            .textLineSpacing(0)
            .text(this._prefix + this._count + this._sufix);
    },

    /**
     * Starts the countdown text
     * @returns {ClientCountDown}
     */
    start: function () {
        var self = this;
        this._intervalTimer = setInterval(function () {
            self._timerTick();
        }, this._interval);

        return this;
    },

    /**
     * Decrements the timer
     * @returns {ClientCountDown}
     * @private
     */
    _timerTick: function () {
        this._count--;
        this.text(this._prefix + this._count + this._sufix);

        if (this._count === 0) {
            this.emit('complete');
            this.stop();
        }

        return this;
    },

    /**
     * Stops the timer
     * @returns {ClientCountDown}
     */
    stop: function () {
        clearInterval(this._intervalTimer);
        return this;
    }
});