function angle(v) {
    var a = v.angleFrom( $V([0, 1]) );
    if (v.e(1) >  0) {return Math.PI * 2 - a }
    else {return a };
}
            
function drawDot(p, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(p.e(1), p.e(2), radius, 0, Math.PI*2, true);
    context.fill();    
};

function drawVec(p, q, color) {
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo( p.e(1), p.e(2) );
    context.lineTo( q.e(1), q.e(2) );
    context.stroke();    
};

function drawPoly(list, pos, rot, fillspec) {
    mylog("drawing poly from glyph:");
    mylog(list);
//    list = [ $V( [-10,10]), $V([-10,-10]), $V([0,0]),$V([-10,10])];
    mylog(list);
    context.beginPath();
    context.strokeStyle = fillspec;
    context.moveTo(pos.e(1), pos.e(2));    
    for (x in list) {
	var step = pos.add( list[x] ).rotate(rot, pos);
	if (x == 0) {	    
	    context.moveTo(step.e(1), step.e(2) );
	} else {
	    context.lineTo(step.e(1), step.e(2) );
	}
    };
    context.stroke();
};

function drawArc(arc_center, raw_arc_angle, arc_width, arc_radius, fillspec) {
    mylog("   Drawing arc:");
    mylog(arc_center);
    context.beginPath();
    // context.lineWidth = 5;
    context.fillStyle = fillspec;
    var arc_angle = raw_arc_angle - 3.0 * Math.PI / 2 ;
    context.arc(arc_center.e(1), arc_center.e(2), arc_radius, arc_angle + arc_width, arc_angle-arc_width, true);
    context.lineTo( arc_center.e(1), arc_center.e(2));
    context.fill();    
};

function checkArc(arc_center, arc, target_pos) {
    var check_vec = arc_center.subtract( target_pos);
    if ( check_vec.modulus() > arc.radius) {return false};
    if ( check_vec.angleFrom( arc.angle ) <= arc.width) {return true};
    return False;
}



function drawShip(state, ships, i, depth) {
    var alpha = 1.0 - i / depth;

    mylog("Drawing ship! " + i + " / " + depth);
    mylog(state);
    var ship = ships[state.object];
    mylog("Got ship: ");
    mylog(ship);
    drawPoly(ship.glyph, state.pos, angle(state.vel), "rgba(255,0,0," + alpha + ")" );
    drawDot(state.pos, 2, "rgba(0,0,0," + alpha + ")" );
    mylog("Drew poly at least!");
//    if (i == 0) {
    if (i != 0) {
	for (x in ship.fire_arcs) {
	    var a = ship.fire_arcs[x];
	    drawArc(state.pos, a.angle + angle(state.vel) , a.width, a.radius, "rgba(255,0,0," + alpha/4 + ")");
	};

	for (x in ship.thrust_arcs) {
	    var a = ship.thrust_arcs[x];
	    drawArc(state.pos, a.angle + angle(state.vel) , a.width, a.radius, "rgba(0,25,25," + alpha/4 + ")");
	};


    mylog("Drew arcs");
    context.beginPath();    
    drawVec( state.pos, state.pos.add(state.vel), "rgba(50,150,255," + alpha + ")");    
    context.fillStyle = "rgb(100,100,0);"
    context.font = "10pt Arial";
    context.fillText("e: " + state.energy.toFixed() +
		     " v: " + state.vel.modulus().toFixed(), 
		     state.pos.e(1) - 5, state.pos.e(2) - 15
		    );
    };
    // mylog("drawing with vf: " + state.vectorfield.elements);
    drawVec( state.pos, state.pos.add(state.acc), "rgba(0,0,255," + alpha + ")");    
//    drawVec( state.pos, state.pos.add(state.vectorfield), "rgba(50,100,255," + alpha + ")");    
};

