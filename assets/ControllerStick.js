var image;

image = {
    render: function (ctx, entity) {
        ctx.beginPath();
        ctx.strokeStyle = entity.id() === "movement_controller_stick" ? "cyan" : "red";
        ctx.arc(0, 0, 40, 0, Math.PI * 2, true);
        return ctx.stroke();
    }
};
