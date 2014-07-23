var PlayerBehaviour = function () {
    var sendMessage = function (messageId) {
        if (!ige.isServer) {
            ige.network.send(messageId);
        }
    };

    if (ige.input.actionState('left')) {
        if (!this.controls.left) {
            this.controls.left = true;
            sendMessage('playerControlLeftDown');
        }
    } else {
        if (this.controls.left) {
            this.controls.left = false;
            sendMessage('playerControlLeftUp');
        }
    }

    if (ige.input.actionState('right')) {
        if (!this.controls.right) {
            this.controls.right = true;
            sendMessage('playerControlRightDown');
        }
    } else {
        if (this.controls.right) {
            this.controls.right = false;
            sendMessage('playerControlRightUp');
        }
    }

    if (ige.input.actionState('thrust')) {
        if (!this.controls.thrust) {
            this.controls.thrust = true;
            sendMessage('playerControlThrustDown');
        }
    } else {
        if (this.controls.thrust) {
            this.controls.thrust = false;
            sendMessage('playerControlThrustUp');
        }
    }

    if (ige.input.actionState('shoot')) {
        if (!this.controls.shoot) {
            this.controls.shoot = true;
            sendMessage('playerControlShootDown');
        }
    } else {
        if (this.controls.shoot) {
            this.controls.shoot = false;
            sendMessage('playerControlShootUp');
        }
    }
};