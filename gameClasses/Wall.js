/**
 * Creates a wall box2d entity to create the map
 * @type {*|void|Function}
 */
var Wall = IgeEntityBox2d.extend({
    classId: 'Wall',

    init: function (wallType) {
        IgeEntityBox2d.prototype.init.call(this);

        // Set the rectangle colour (this is read in the Rectangle.js smart texture)
        this._rectColor = '#ffffff';

        var category;
        var texture;

        // Define the polygon for collision
        var triangles;
        var collisionPoly;

        // Create an array of box2d fixture definitions
        // based on the triangles
        var fixDefs = [];

        switch (wallType) {
        case 'br':
            category = 'wall_br';
            collisionPoly = new IgePoly2d()
                .addPoint(-this._geometry.x2, this._geometry.y2)
                .addPoint(this._geometry.x2, this._geometry.y2)
                .addPoint(this._geometry.x2, -this._geometry.y2);
            texture = 'br';
            break;
        case 'bl':
            category = 'wall_bl';
            collisionPoly = new IgePoly2d()
                .addPoint(this._geometry.x2, this._geometry.y2)
                .addPoint(-this._geometry.x2, this._geometry.y2)
                .addPoint(-this._geometry.x2, -this._geometry.y2);
            texture = 'bl';
            break;
        case 'tl':
            category = 'wall_tl';
            collisionPoly = new IgePoly2d()
                .addPoint(this._geometry.x2, -this._geometry.y2)
                .addPoint(-this._geometry.x2, -this._geometry.y2)
                .addPoint(-this._geometry.x2, this._geometry.y2);
            texture = 'tl';
            break;
        case 'tr':
            category = 'wall_tr';
            collisionPoly = new IgePoly2d()
                .addPoint(-this._geometry.x2, -this._geometry.y2)
                .addPoint(this._geometry.x2, -this._geometry.y2)
                .addPoint(this._geometry.x2, this._geometry.y2);
            texture = 'tr';
            break;
        default:
            category = 'wall_box';
            texture = 'box';
            break;
        }

        this.category(category)
            .width(40)
            .height(40);

        if (collisionPoly) {
            // Scale the polygon by the box2d scale ratio
            collisionPoly.divide(ige.box2d._scaleRatio);

            // Now convert this polygon into an array of triangles
            triangles = collisionPoly.triangulate();
            this.triangles = triangles;
            var i;
            for (i = 0; i < this.triangles.length; i++) {
                fixDefs.push({
                    filter: {
                        categoryBits: 0x0006,
                        maskBits: 0xffff
                    },
                    shape: {
                        type: 'polygon',
                        data: this.triangles[i]
                    }
                });
            }
        } else {
            fixDefs.push({
                filter: {
                    categoryBits: 0x0006,
                    maskBits: 0xffff
                },
                shape: {
                    type: 'rectangle'
                }
            });
        }

        this.box2dBody({
            type: 'static',
            allowSleep: true,
            fixtures: fixDefs
        });

        if (!ige.isServer) {
            this.texture(ige.client.textures.wall[texture]);
            this.depth(1);
        }
    }
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = Wall;
}