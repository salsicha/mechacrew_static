function getGravSources(initstates) {
    var argstates = initstates;
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
    
//    var vf_string = "function(x,y){return([" + game.vectorfield_def[0] + ", " + game.vectorfield_def[1] + "]);}"
//    eval( "var vf = " + vf_string);
//    game.vectorfield = vf;
//    var v = $V( game.vectorfield(pos) );
    var v = $V( [0,0] );
    for (m in masses) {
	mylog("...getting gravity between " + vectorToString(pos) + " and " + vectorToString( masses[m].pos ));
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
    mylog( "Set local VF: " + localstate.vectorfield.elements);
    return (localstate);
};

function vectorToString(v) {
    // mylog("trying to convert: " + v);
    return( "<" + v.e(1).toFixed(2) + "," + v.e(2).toFixed(2) + ">");
};



function objectAsString(s) {
//    mylog("S! " + s);
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
    mylog("Logging states...");
    for (i in stuff.new_states) {
	mylog("Hi!");
	mylog(i +": " + stateAsString(stuff.new_states[i]));
    };
};

function showStates( gamestate, max_depth) {
    mylog("Showing States:");
    // mylog(gamestate);
    var statelist = gamestate.new_states;
    var showed = 1;
    mylog("BAM!", statelist);
    for (current_depth in statelist ) {	 
	mylog("...", current_depth, showed);
	if (max_depth < showed) {
	    mylog("Reached depth " + showed + "/" + max_depth);
	    break;
	}
	showed += 1;
	var s = statelist[current_depth];
	mylog("  checking (" + current_depth + "): ");
	mylog(s);
	for (y in s) {
	    mylog("   State " + y + ": ");
	    mylog( s[y]);
	    drawShip(s[y], gamestate.new_objects, showed, max_depth );
	};
    };
}

function clearView(height, width) {
    context.clearRect(0, 0, height, width); 
}

function initWorld(height, width, init) {
    mylog("Initialized World: " + [init]);
    clearView(height, width);
    var masses = getGravSources( init );

  //  for (i in init.new_states) {
//	init.new_states[i].vectorfield =  vectorField(init, masses, init.new_states[i].pos);
 //   };

    return init;    
}

function drawWorld() {
    clearView($('#canvas').height() ,$('#canvas').width());  
    showStates(states, 5);
    logStates(states);
};




function get_object_state_from_json( state_json ) {
    var f = state_json.fields;
    var newstate = {
	"metatype" : "object state",
	"pos" : $V( [f.pos_x, f.pos_y] ),
	"vel" : $V( [f.vel_x, f.vel_y] ),
	"acc" : $V( [f.acc_x, f.acc_y] ),
	"energy" : f.energy,
	"damage" : f.damage,
    	"worldstate" :	f.worldstate,
	"object"	: f.vobject
    };
        
    mylog("Got State: " + String(newstate))	
    return( newstate);
};

function get_object_from_json( state_json ) {
    var f = state_json.fields;
    var glyph = [];
    var glyph_strings = f.glyph.split(";");
    for (g_term in glyph_strings) {
	var elmts = glyph_strings[g_term].split(",");
	glyph.push( $V( [parseFloat(elmts[0]), parseFloat(elmts[1])] ) );
    };
    mylog("Glyph:");
    mylog(glyph);
    var newstate = {
	"metatype" : "object",
	"vtype" : f.vtype,
	"max_energy" : 	f.max_energy,
	"max_damage" : 	f.max_damage,
	"glyph" : 	glyph,
	"mass" : 	f.mass,
	"name" : 	f.name,
	"worldstate" :	f.worldstate,
	"fire_arcs"  :  [],
	"thrust_arcs" : []
    };
	
    mylog("Got Object: " + String(newstate))
    return( newstate);
};

function get_worldstate_from_json( state_json ) {
    var f = state_json.fields;
    var newstate = {
	"metatype" : "worldstate",
	"id" : state_json.pk
    };
    mylog("Got Worldstate: ");
    mylog(String(newstate));
    return( newstate.id);
};

function thrust_arc_from_json( thrust_json) {
    return {"angle": parseFloat(thrust_json.fields.angle_center),
	    "width": parseFloat(thrust_json.fields.angle_width),
	    "radius" : parseFloat(thrust_json.fields.radius)
	   };
};

function fire_arc_from_json( fire_json) {
    return {"angle": parseFloat(fire_json.fields.angle_center),
	    "width": parseFloat(fire_json.fields.angle_width),
	    "radius" : parseFloat(fire_json.fields.radius)
	   };
};


function get_state_for_object( world, object_id, turn) {
    mylog("Checking for object " + object_id + " in turn " + turn);
    var turnstate = world["new_states"][turn];
    
    for (i in turnstate) {
	mylog("Checking turnstate:");
	mylog(turnstate);
	if (turnstate[i].object == object_id) {
	    return( turnstate[i] );
	};
    };
    mylog("Not found, wtf!");
  };

function mylog(label, object) {
    console.log(label, object);
    //mylog("Label:");
    //mylog(object);
};

function process_game_json( raw ) {
    var newstates = {
	"new_states": {},
	"new_objects" : {},
	"game_conf" : {},
	"controlling" : 0,
	"current_turn" : 0
    };

    for (j in raw) {
	mylog("processing", raw[j]);
        switch (raw[j].model) {
	case 'vector.vobjectstate':
	    mylog("Got a state!", raw[j] );
	    mylog("Already got worldstats:", newstates);
	    mylog("Foo", raw[j].fields);
	    newstates["new_states"][raw[j].fields.worldstate].push( get_object_state_from_json( raw[j] ));
	    break;
	case 'vector.vobject':
	    mylog("Got an object!" , raw[j] );
	    newstates["new_objects"][raw[j].pk] = get_object_from_json( raw[j] );
	    if (raw[j].fields.vtype == 'ship') {
		newstates["controlling"] = raw[j].pk;
		mylog("Assigned control to ", raw[j].pk); 
	    };
	    break;
	case 'vector.worldstate':
	    mylog("Got a WorldState" , raw[j] );		
	    var newturn = get_worldstate_from_json( raw[j] );

	    newstates.new_states[newturn] = []; 
	    if (newturn >  newstates["current_turn"]) {
		newstates["current_turn"] = newturn;
	    };
	    break;
	case 'vector.game':
	    mylog("Got a Game:" , raw[j] );
	    newstates["game_conf"] = raw[j];
	    break;
	case 'vector.firearc':
	    mylog('...FIREing solution:' , raw[j]);
	    newstates.new_objects[raw[j].fields.vobject].fire_arcs.push( fire_arc_from_json( raw[j] ));
	    break;
	case 'vector.thrustarc':
	    mylog('...thrusting solution:' , raw[j]);
	    newstates.new_objects[raw[j].fields.vobject].thrust_arcs.push( thrust_arc_from_json( raw[j] ));
	};
	
    };
    mylog("New turn: " , newstates["current_turn"]);
    return(newstates);
};


/* Set up actual instances */
//var init_game_json = [];
var init = {};

$("#marquee").text("Loading...");
$.getJSON("http://overextendedmetaphors.com/mechacrew/game/" + game_id + "/", 
	  function(gamejson){
	      mylog("JSON",gamejson);
	      init = process_game_json(gamejson);
	      states = initWorld($('#canvas').height() ,$('#canvas').width(), init);
	      drawWorld();
	      $("#marquee").text("vector");
	  });

var context = $('#canvas')[0].getContext('2d');
var states = {};
var turn = 0;

$('#canvas').click(function(e) {
    /* e will give us absolute x, y so we need to calculate relative to canvas position */    
    var m_pos = $('#canvas').position();
    var ox = e.pageX - m_pos.left;
    var oy = e.pageY - m_pos.top;
    var click_vec = $V( [ox, oy] );
    mylog("clicked",click_vec);
    // var state = states.slice(0)[0][0];
    var state = states["new_objects"][ states["controlling"] ];
    mylog("Controlling state:", state);

    var statestate = get_state_for_object(states, states["controlling"], states["current_turn"]);
    mylog("Steering:", statestate);

    var steering = click_vec.subtract(statestate.pos);

    var message = "Click Here.";

    if (checkArc( statestate.pos, state.thrust_arcs[0], click_vec)) { 
	statestate.acc = steering;
	message = "cost: " + statestate.acc.modulus().toFixed() ;
	$("#marquee").text("Clicking!");
	//set local acc



    } else {
	message = "Outside\nPerfomance\nEnvelope."
	
	mylog("Worse click!");
    };

    drawWorld();
	
    drawVec( statestate.pos, statestate.pos.add(statestate.acc), "rgb(200,0,0)");
    drawVec( statestate.pos, statestate.pos.add(statestate.vel).add(statestate.acc), "rgb(0,50,100)");
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
    mylog("---===( turn:" + turn + " )===---");
    var statestate = get_state_for_object(states, states["controlling"], states["current_turn"]);

    $.getJSON("http://overextendedmetaphors.com/vector/setacc/" + game_id +"/"+ states["controlling"] + "/" + 
	      statestate.acc.e(1).toFixed(2) + "/" + statestate.acc.e(2).toFixed(2), 
	      function(gamejson){
		  mylog("JSON",gamejson);
		  mylog("Control REsponse!", gamejson);
		  init = process_game_json(gamejson);
		  states = initWorld($('#canvas').height() ,$('#canvas').width(), init);
		  drawWorld();
		  $("#marquee").text("vector");
	      });
    
    //drawWorld();
});