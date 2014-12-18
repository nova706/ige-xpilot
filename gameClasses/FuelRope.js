/**
 * Creates a rope entity between a fixed object and moving object.
 * Client rendering only.
 * @type {*|void|Function}
 */
var FuelRope = IgeEntity.extend({
    classId: 'FuelRope',

    init: function (fixedEntity, dynamicEntity) {
        IgeEntity.prototype.init.call(this);

        this.fixed = fixedEntity;
        this.dynamic = dynamicEntity;
        this.texture(ige.client.textures.line);
        this.translateTo(fixedEntity._translate.x, fixedEntity._translate.y, 0);
        this.depth(2);
    },

    update: function (ctx) {

        // Move the entity based on the dynamic entity's position
        var xDiff = this.dynamic._translate.x - this.fixed._translate.x;
        var yDiff = this.dynamic._translate.y - this.fixed._translate.y;
        this.width(Math.abs(xDiff * 2)).height(Math.abs(yDiff * 2));
        this.x = xDiff;
        this.y = yDiff;

        IgeEntity.prototype.update.call(this, ctx);
    }
});