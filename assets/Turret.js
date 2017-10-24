var image = {
    render: function (ctx, entity) {
        // Draw the turret entity
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(0, -entity._bounds2d.y2);
        ctx.lineTo(entity._bounds2d.x2, entity._bounds2d.y2);
        ctx.lineTo(-entity._bounds2d.x2, entity._bounds2d.y2);
        ctx.lineTo(0, -entity._bounds2d.y2);
        ctx.fill();
        ctx.stroke();
    }
};