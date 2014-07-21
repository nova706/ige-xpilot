var image;

image = {
    render: function (ctx, entity) {
        ctx.beginPath();
        ctx.strokeStyle = entity.id() === "movement_controller" ? "cyan" : "red";
        ctx.lineWidth = 6;
        ctx.arc(0, 0, 40, 0, Math.PI * 2, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = entity.id() === "movement_controller" ? "cyan" : "red";
        ctx.lineWidth = 2;
        ctx.arc(0, 0, 60, 0, Math.PI * 2, true);
        return ctx.stroke();
    }
};
