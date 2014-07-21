/**
 * Creates a text element showing a increase or decrease in score
 * @type {*|void|Function}
 */
var ClientScore = IgeFontEntity.extend({
    classId: 'ClientScore',

    init: function (score) {
        IgeFontEntity.prototype.init.call(this);

        var text;

        if (score > 0) {
            text = "+ " + score;
            this.colorOverlay('green');
        } else {
            text = "- " + score;
            this.colorOverlay('#ff6f6f');
        }

        this.depth(4)
            .width(480)
            .height(110)
            .texture(ige.client.textures.font)
            .textAlignX(1)
            .textLineSpacing(0)
            .text(text)
            .hide();
    },

    /**
     * Displays the text
     * @param {Number} inMs Delays the display of the text
     */
    start: function (inMs) {
        var self = this;
        if (inMs) {
            setTimeout(function () {
                self.start();
            }, inMs);
            return;
        }

        this.show();

        this._translate.tween()
            .duration(3000)
            .properties({
                y: this._translate.y - 100
            })
            .easing('outElastic')
            .afterTween(function () {
                self.tween()
                    .duration(500)
                    .properties({
                        _opacity: 0
                    })
                    .afterTween(function () {
                        self.destroy();
                    })
                    .start();
            })
            .start();
    }
});