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
    context.beginPath();
    // context.lineWidth = 5;
    context.fillStyle = fillspec;
    var arc_angle = raw_arc_angle - Math.PI / 2 ;
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



function drawShip(state, i, depth) {
    var alpha = 1.0 - i / depth;

    drawPoly(state.glyph, state.pos, angle(state.vel), "rgba(255,0,0," + alpha + ")" );
    if (i == 0) {
	for (x in state.fire_arcs) {
	    var a = state.fire_arcs[x];
	    drawArc(state.pos, a.angle + angle(state.vel) , a.width, a.radius, "rgba(255,0,0," + alpha/4 + ")");
	};
	for (x in state.thrust_arcs) {
	    var a = state.thrust_arcs[x];
	    drawArc(state.pos, a.angle + angle(state.vel) , a.width, a.radius, "rgba(0,255,0," + alpha/4 + ")");
	};

    
    context.beginPath();    
    drawVec( state.pos, state.pos.add(state.vel), "rgba(0,0,255," + alpha + ")");    
    context.fillStyle = "rgb(100,100,0);"
    context.font = "10pt Arial";
    context.fillText("e: " + state.energy.toFixed() +
		     " v: " + state.vel.modulus().toFixed(), 
		     state.pos.e(1) - 5, state.pos.e(2) - 15
		    );
    };
    // console.log("drawing with vf: " + state.vectorfield.elements);
    drawVec( state.pos, state.pos.add(state.acc), "rgba(0,0,255," + alpha + ")");    
    drawVec( state.pos, state.pos.add(state.vectorfield), "rgba(50,100,255," + alpha + ")");    
};

function getGravSources(argstates) {
    var masses = [];
    for (i in argstates) {
	if (argstates[i].mass >= 100) {
	    masses.push( argstates[i] );
	};
    };
    return masses;
};

function get_objects_from_ids( ids, things) {
    var filtered = [];
    for (t in things) {
	if (things[t].id in ids) {
	    unshift( filtered, things[t]);
	}
    }
    return( filtered );
}

function updateState(game, argstates) {
    var new_states = [];
    
    var masses = getGravSources(argstates);
    for (i in argstates) {
	new_states.push( updateOneState(game,  masses, argstates[i] ) );
    };
    var targets = get_objects_from_ids( game.victory.targetlist );
    for (s in new_states) {
	for (f in new_states[s].fire_arcs) {
	    for (t in targets) {
		if ( checkArc( new_states[s].pos, new_states[s].fire_arcs[f], targets[t].pos) ){
		    alert("Game Over, man.");
		}
	    }
	}
    }
    return new_states;
}

function vectorField(game, masses, pos) {
    var vf_string = "function(x,y){return([" + game.vectorfield_def[0] + ", " + game.vectorfield_def[1] + "]);}"
    eval( "var vf = " + vf_string);
    game.vectorfield = vf;
    var v = $V( game.vectorfield(pos) );
    for (m in masses) {
	console.log("...getting gravity between " + vectorToString(pos) + " and " + vectorToString( masses[m].pos ));
	var gravity = masses[m].pos.subtract( pos )   ;
	if (gravity.modulus() != 0) {	    
	    var mag = masses[m].mass * game.gravitational_constant / Math.pow(gravity.modulus(), 2) ;
	    v = v.add( gravity.toUnitVector().multiply(mag) );
	};
    };
    return( v );
};

function updateOneState(game, masses, argstate) {
    var new_vel = argstate.vel.add(argstate.acc.multiply( 1 / argstate.mass)) ;
    new_vel = new_vel.add(argstate.vectorfield.multiply( 1 / argstate.mass) );
    
    var localstate = {
	type : argstate.type,
	vel : $V( new_vel ),
	pos : $V( argstate.pos.add(new_vel) ),
	acc : $V( [0,0] ),
	fire_arcs : argstate.fire_arcs,
	thrust_arcs : argstate.thrust_arcs,
	glyph: argstate.glyph,
	energy: argstate.energy - argstate.acc.modulus(),
	mass: argstate.mass
    };
    localstate.vectorfield = vectorField(game, masses, localstate.pos);
    console.log( "Set local VF: " + localstate.vectorfield.elements);
    return (localstate);
};

function vectorToString(v) {
    // console.log("trying to convert: " + v);
    return( "<" + v.e(1).toFixed(2) + "," + v.e(2).toFixed(2) + ">");
};



function objectAsString(s) {
//    console.log("S! " + s);
    var summary_string = "";
    summary_string +=   String(s.type ) + ":"  ;
    summary_string += "P:" + vectorToString(s.pos) + " V:" + vectorToString(s.vel) + " A:" + vectorToString(s.acc)   ;
    
    return summary_string;
};

function stateAsString(state) {
    var summary_string = "";
    for (s in state) {
	summary_string += objectAsString(state[s]) + "\n";
    };
    return summary_string;
};

function logStates(stuff) {
    console.log("Logging states...");
    for (i in stuff) {
	console.log(i +": " + stateAsString(stuff[i]));
    };
};

function showStates( statelist, depth) {
    for (x in statelist ) {	 
	// drawShip(statelist[statelist.length - x], 1.0 - x / depth  );
	if (x > depth) {break}
	var s = statelist[x];
	for (y in s) {
	    drawShip(s[y], x, depth );
	};
    };
}

function clearView(height, width) {
    context.clearRect(0, 0, height, width); 
}

function initWorld(height, width, init_states_json, init_game_json) {
    console.log("Initialized World: " + [init_states_json]);
    clearView(height, width);
    var masses = getGravSources( init_states_json );
    for (i in init_states_json) {
	init_states_json[i].vectorfield =  vectorField(init_game_json, masses, init_states_json[i].pos);
    };

    return [init_states_json];    
}

function drawWorld() {
    clearView($('#canvas').height() ,$('#canvas').width());  
    showStates(states, 5);
    logStates(states);
};


/* Set up actual instances */
var init_game_json = [];
var init_states_json = [];

$.getJSON("gameconf.json", function(confjson){
    init_game_json = confjson;
    $.getJSON("gamestates.json", function(statesjson){
    init_states_json = statesjson;
	states = initWorld($('#canvas').height() ,$('#canvas').width(), init_states_json, init_game_json[0]);
	drawWorld();
    });
});





var context = $('#canvas')[0].getContext('2d');

var states = [];


var turn = 0;


$('#canvas').click(function(e) {
    /* e will give us absolute x, y so we need to calculate relative to canvas position */    
    var m_pos = $('#canvas').position();
    var ox = e.pageX - m_pos.left;
    var oy = e.pageY - m_pos.top;
    var click_vec = $V( [ox, oy] );
    var state = states.slice(0)[0][0];
    var steering = click_vec.subtract(state.pos);
    var message = "Click Here.";

    if (checkArc( state.pos, state.thrust_arcs[0], click_vec)) { 
	state.acc = steering;
	message = "cost: " + state.acc.modulus().toFixed() ;
    } else {
	message = "Outside\nPerfomance\nEnvelope."
	
	console.log("Worse click!");
    };

    drawWorld();
	
    drawVec( state.pos, state.pos.add(state.acc), "rgb(200,0,0)");
    drawVec( state.pos, state.pos.add(state.vel).add(state.acc), "rgb(0,50,100)");
    context.fillStyle="rgb(0,0,0);";
    context.font = "10pt Arial";
    context.fillText(message, ox+5, oy+5);
});


$('#clear-button').click(function() {
    state = initWorld($('#canvas').height() ,$('#canvas').width());    
    states = [];
    drawShip(state, 1, 1);
    turn = 0;
});




$('#run-button').click(function() {
    turn += 1;
    console.log("---===( turn:" + turn + " )===---");

    states.unshift( updateState(init_game_json[0], states.slice(0)[0]) ); 
    // logStates(states);
    
    drawWorld();
});