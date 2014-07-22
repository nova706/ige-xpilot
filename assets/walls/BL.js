var image = {
    render: function (ctx, entity) {
        ctx.fillStyle = '#000000';
        ctx.strokeStyle = '#4c7efc';
        ctx.beginPath();
        ctx.moveTo(entity._geometry.x2, entity._geometry.y2);
        ctx.lineTo(-entity._geometry.x2, entity._geometry.y2);
        ctx.lineTo(-entity._geometry.x2, -entity._geometry.y2);
        ctx.lineTo(entity._geometry.x2, entity._geometry.y2);
        ctx.fill();
        ctx.stroke();
    }
};