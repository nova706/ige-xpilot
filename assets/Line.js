var image = {
	render: function (ctx, entity) {
		ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(entity.x, entity.y);
        ctx.stroke();
	}
};