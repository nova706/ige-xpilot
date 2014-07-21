

var image = {
    render: function (ctx, entity) {
        var pointArray = entity.pointArray;

        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();

        for(p = 0; p < pointArray.length; p++){
            ctx.moveTo(pointArray[p].x, pointArray[p].y);
            ctx.lineTo(pointArray[p].ex, pointArray[p].ey);
            ctx.stroke();
        }

        ctx.closePath();
    }
};