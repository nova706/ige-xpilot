var image = {
    render: function (ctx, entity) {
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-entity._geometry.x2, -entity._geometry.y2);
        ctx.lineTo(entity._geometry.x2, -entity._geometry.y2);
        ctx.lineTo(entity._geometry.x2, entity._geometry.y2);
        ctx.lineTo(-entity._geometry.x2, -entity._geometry.y2);
        ctx.stroke();
    }
};