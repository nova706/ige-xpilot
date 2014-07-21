/**
 * Client entity for rendering a shield around a player
 * @type {*|void|Function}
 */
var Shield = IgeEntity.extend({
    classId: 'Shield',

    init: function () {
        IgeEntity.prototype.init.call(this);

        this.width(20).height(20);
        function calcPointsCirc(cx, cy, rad, dashLength) {
            var n = rad / dashLength,
                alpha = Math.PI * 2 / n,
                points = [],
                i = -1;

            while (i < n) {
                var theta = alpha * i,
                    theta2 = alpha * (i + 1);

                points.push({x: (Math.cos(theta) * rad) + cx, y: (Math.sin(theta) * rad) + cy, ex: (Math.cos(theta2) * rad) + cx, ey: (Math.sin(theta2) * rad) + cy});
                i += 2;
            }
            return points;
        }

        this.pointArray = calcPointsCirc(0, 0, 20, 1);
        this.texture(ige.client.textures.shield);
    }
});