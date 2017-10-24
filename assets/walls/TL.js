var image = {
    render: function (ctx, entity) {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#4c7efc';
        ctx.beginPath();
        ctx.moveTo(entity._bounds2d.x2, -entity._bounds2d.y2);
        ctx.lineTo(-entity._bounds2d.x2, -entity._bounds2d.y2);
        ctx.lineTo(-entity._bounds2d.x2, entity._bounds2d.y2);
        ctx.lineTo(entity._bounds2d.x2, -entity._bounds2d.y2);
        ctx.fill();
        ctx.stroke();
    }
};