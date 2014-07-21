var TouchControllerComponent;

TouchControllerComponent = IgeEventingClass.extend({
    classId: 'TouchControllerComponent',
    componentId: 'controller',
    init: function (_entity, _options) {
        var self;
        this._entity = _entity;
        this._options = _options;
        self = this;
        this._movement_controller = new IgeEntity().id('movement_controller');
        this._movement_controller_stick = new IgeEntity().id('movement_controller_stick').mount(this._movement_controller);
        if (this._options.controller_texture) {
            this._movement_controller.texture(this._options.controller_texture);
        }
        if (this._options.controller_stick_texture) {
            this._movement_controller_stick.texture(this._options.controller_stick_texture);
        }
        this._aiming_controller = new IgeEntity().id('aiming_controller');
        this._aiming_controller_stick = new IgeEntity().id('aiming_controller_stick').mount(this._aiming_controller);
        if (this._options.controller_texture) {
            this._aiming_controller.texture(this._options.controller_texture);
        }
        if (this._options.controller_stick_texture) {
            this._aiming_controller_stick.texture(this._options.controller_stick_texture);
        }
        this.movement = {
            id: -1,
            pos: new IgePoint(0, 0, 0),
            start_pos: new IgePoint(0, 0, 0),
            vector: new IgePoint(0, 0, 0)
        };
        this.aiming = {
            id: -1,
            pos: new IgePoint(0, 0, 0),
            start_pos: new IgePoint(0, 0, 0),
            vector: new IgePoint(0, 0, 0)
        };
        this.firing = false;
        ige.input.on('mouseDown', function (event) {
            return self._mouseDown.call(self, event);
        });
        ige.input.on('mouseMove', function (event) {
            return self._mouseMove.call(self, event);
        });
        ige.input.on('mouseUp', function (event) {
            return self._mouseUp.call(self, event);
        });
        return this.log('Touch Controller enabled');
    },
    _mouseDown: function (e) {
        var side, touch, touches, _i, _len, _ref;
        if (!e.changedTouches) {
            return;
        }
        _ref = e.changedTouches;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            touch = _ref[_i];
            if (this._options.movement || !this._options.aiming) {
                side = "movement";
            }
            if (this._options.aiming && (!this._options.movement || touch.clientX > ige._geometry.x2)) {
                side = "aiming";
            }
            if (this[side].id < 0) {
                if (side === "aiming") {
                    this.firing = true;
                }
                this[side].id = touch.identifier;
                this[side].start_pos.x = touch.clientX - ige._geometry.x2;
                this[side].start_pos.y = touch.clientY - ige._geometry.y2;
                this[side].pos = this[side].start_pos.clone();
                this[side].vector.x = 0;
                this[side].vector.y = 0;
                this["_" + side + "_controller_stick"].translateToPoint(this[side].vector);
                this["_" + side + "_controller"].translateToPoint(this[side].start_pos);
                this["_" + side + "_controller"].mount(this._options.scene);
                if (this._options.events) {
                    this.emit('controllerOn', [side, this[side].vector]);
                }
                continue;
            }
        }
        return touches = e.touches;
    },
    _mouseMove: function (e) {
        var side, touch, _i, _len, _ref;
        if (!e.changedTouches) {
            return;
        }
        e.preventDefault();
        _ref = e.changedTouches;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            touch = _ref[_i];
            side = null;
            if (this.movement.id === touch.identifier) {
                side = "movement";
            }
            if (this.aiming.id === touch.identifier) {
                side = "aiming";
            }
            if (side) {
                this[side].pos.x = touch.clientX - ige._geometry.x2;
                this[side].pos.y = touch.clientY - ige._geometry.y2;
                this[side].vector = this[side].pos.clone();
                this[side].vector.thisMinusPoint(this[side].start_pos);
                this["_" + side + "_controller_stick"].translateToPoint(this[side].vector);
                if (this._options.events) {
                    this.emit('controllerMove', [side, this[side].vector]);
                }
            }
        }
        return this._touches = e.touches;
    },
    _mouseUp: function (e) {
        var side, touch, _i, _len, _ref, _results;
        if (!e.changedTouches) {
            return;
        }
        this._touches = e.touches;
        _ref = e.changedTouches;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            touch = _ref[_i];
            side = null;
            if (this.movement.id === touch.identifier) {
                side = "movement";
            }
            if (this.aiming.id === touch.identifier) {
                side = "aiming";
            }
            if (side) {
                if (this._options.events) {
                    this.emit('controllerOff', [side]);
                }
                if (side === "aiming") {
                    this.firing = false;
                }
                this[side].id = -1;
                if (side === "movement") {
                    this[side].vector.x = 0;
                    this[side].vector.y = 0;
                    this["_" + side + "_controller_stick"].translateToPoint(this[side].start_pos);
                }
                this["_" + side + "_controller"].unMount();
                break;
            } else {
                _results.push(void 0);
            }
        }
        return _results;
    }
});
