function mylog(label, object) {
    console.log(label, object);
};


function drawWorld( things ) {
    mylog("Drawing the World!");
    mylog(things);
    var glyph = [ $V( [-10,10]), $V([-10,-10]), $V([0,0]),$V([-10,10])];
    var turret_glyph = [ $V( [0,2]), $V([8,2]), $V([8,-2]), $V([0,-2]),];
    var v = things['vehicles'];
    for (i in v) {
	drawPoly(glyph, $V( [v[i].fields.pos_x, v[i].fields.pos_y] ),
		 v[i].fields.rotation, '#44AA99');	
    };
    
    var t = things['turrets'];
    for (i in t) {
	drawPoly(turret_glyph, $V( [ v[ [t[i].fields.vehicle] ].fields.pos_x, v[ t[i].fields.vehicle].fields.pos_y] ),
		 t[i].fields.rotation, '#000000');	
	drawArc($V( [ v[ [t[i].fields.vehicle] ].fields.pos_x, v[ t[i].fields.vehicle].fields.pos_y] ),
		t[i].fields.rotation, 0.5, 20, '#999999');

    };


};

function process_game_json( raw ) {

    var vehicles = {};
    var turrets = {};
    var vehicle_shape = [ ];


    for (j in raw) {
	mylog("processing", raw[j]);
        switch (raw[j].model) {
	case 'basic.vehicle':
	    mylog("Got a state!", raw[j] );
	    vehicles[raw[j].pk] = raw[j]
	    break;
	case 'basic.turret':
	    mylog("Got a turret!", raw[j] );
	    turrets[raw[j].pk] = raw[j]
	    break;
	};	
    };
    return( { "vehicles" : vehicles, "turrets" : turrets });
};


/* Set up actual instances */
//var init_game_json = [];
var init = {};

$("#marquee").text("Loading...");
var loc=location.search.substr(1);
var game_id = loc;
if (! loc){
    alert("No game ID specified in URL. WTF.");
}

// $.getJSON("http://mechacrew.com/worldview/" + game_id + "/1/", 
// $.getJSON("http://" + server_address.php + "/" + game_id + "/1/", 
$.getJSON("http://127.0.0.1:8009/worldview/" + game_id + "/1/", 
	  function(gamejson){
	      mylog("JSON",gamejson);
	      init = process_game_json(gamejson);
	      // states = initWorld($('#canvas').height() ,$('#canvas').width(), init);
	      drawWorld(init);
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