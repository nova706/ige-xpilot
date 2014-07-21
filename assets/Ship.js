var image = {
    render: function (ctx, entity) {
        // Draw the player entity
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(0, -entity._geometry.y2);
        ctx.lineTo(entity._geometry.x2, entity._geometry.y2);
        ctx.lineTo(0, entity._geometry.y2 - 5);
        ctx.lineTo(-entity._geometry.x2, entity._geometry.y2);
        ctx.lineTo(0, -entity._geometry.y2);
        ctx.fill();
        ctx.stroke();
    }
};