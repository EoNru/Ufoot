var GC = { //Game Constants
	gameWidth: 796, // in pixels
	gameHeight: 540, // in pixels
	fieldWidth: 730,
	fieldHeight: 466,
	frameTime: 20, // in milliseconds
    //frameTime: 2000, // for tests
	playerSize: 20, // in pixels
	playerMass: 20,
    playerBounceFactor: 0.7, // 0  - no bounce, 1 - elastic bounce
    playerStrikeDistance: 8, // in pixels from player
	ballSize: 16, // in pixels
	ballMass: 10,
    ballBounceFactor: 0.9, // 0  - no bounce, 1 - elastic bounce
	frictionMultiplierPlayer: 0.9, //Unitless, reduces speed per frame
	frictionMultiplierBall: 0.98, //Unitless, reduces speed per frame
	maxSpeedPlayer: 5, // pixels per frame
	maxSpeedBall: 10, // pixels per frame
	acceleration: 0.3, // (pixels per frame) per frame
	playerHitStrength: 20, // velocity magnitude
    barSize: 10,
    barMass: 10000000000, // really big mass
    goalSize: 140, // in pixels
	roomCapacity: 1
};

var players = [];
var rooms = [];

var Room = function(roomID) {
	this.roomID = roomID;
	this.localPlayers = [];
	this.capacity = GC.roomCapacity; // temp for tests
    this.goal = false;
    this.score = new Array(0, 0);
    this.resetCounter = 0;
	this.ball = new Ball();
    this.ball.roomID = roomID;
    this.bars = [];
    for(var i = 0; i < 4; i++) {
        this.bars[i] = new Bar();
    }
};

var Player = function(userID) {
	this.playerID = userID;
    this.team = 0;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = GC.maxSpeedPlayer;
	this.controls = [];
	for(var i = 0; i < 4; i++) {
		this.controls[i] = false;
	}
	this.hitPressed = false;
    this.hitPerformed = false;
    this.bounceFactor = GC.playerBounceFactor;
    this.size = GC.playerSize;
    this.mass = GC.playerMass;
    this.acceleration = GC.acceleration;
    this.strikeDistance = GC.playerStrikeDistance;
    this.frictionFactor = GC.frictionMultiplierPlayer;
    this.hitStrength = GC.playerHitStrength;
    this.static = false;
};

var Ball = function() {
    this.roomID = 0;
	this.x = 0;
	this.y = 0;
	this.vx = 0;
	this.vy = 0;
    this.maxSpeed = GC.maxSpeedBall;
    this.bounceFactor = GC.ballBounceFactor;
    this.size = GC.ballSize;
    this.mass = GC.ballMass;
    this.frictionFactor = GC.frictionMultiplierBall;
    this.indexInRoom = -1;
    this.static = false;
};

var Bar = function() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.maxSpeed = 0;
    this.size = GC.barSize;
    this.mass = GC.barMass;
    this.static = true;
}

function AddNewPlayer(userID, name) {
    if(rooms.length === 0) {
		CreateNewRoom();
    }
    players[userID] = new Player(userID);
    players[userID].roomID = rooms.length - 1;
    players[userID].name = name;
    players[userID].indexInRoom = rooms[rooms.length - 1].localPlayers.length;
    if(rooms[rooms.length - 1].localPlayers.length < rooms[rooms.length - 1].capacity / 2) {
        players[userID].team = 1;
    }
    else {
        players[userID].team = 2;
    }
    rooms[rooms.length - 1].localPlayers.push(players[userID]);
    if(rooms[rooms.length - 1].localPlayers.length == rooms[rooms.length - 1].capacity) {
		rooms[rooms.length - 1].full = true;
		StartGame(rooms.length - 1);
		CreateNewRoom();
    }
}

function CreateNewRoom() {
	var newRoom;
	newRoom = new Room(rooms.length);
	rooms.push(newRoom);
}

if (typeof exports !== "undefined")
{
	exports.GC = GC;
	exports.rooms = rooms;
	exports.players = players;
	exports.AddNewPlayer = AddNewPlayer;
	exports.UpdateRoom = UpdateRoom;
	exports.UpdateControl = UpdateControl;
}

function StartGame (roomID) {
    PlacePlayers(roomID);
    PlaceBall(roomID);
    PlaceBars(roomID);
}

function ResetGame(roomID) {
    var i; // counter
    PlacePlayers(roomID);
    PlaceBall(roomID);
    for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        rooms[roomID].localPlayers[i].vx = 0;
        rooms[roomID].localPlayers[i].vy = 0;
    }
    rooms[roomID].ball.vx = 0;
    rooms[roomID].ball.vy = 0;
    rooms[roomID].goal = false;
}
function PlaceBall(roomID) {
    rooms[roomID].ball.x = Math.round(GC.gameWidth / 2);
    rooms[roomID].ball.y = Math.round(GC.gameHeight / 2);
}
function PlacePlayers(roomID) {
    switch(rooms[roomID].capacity) {
        case 1:
            rooms[roomID].localPlayers[0].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[0].y = Math.round(GC.gameHeight / 2);
            break;
        case 2:
            rooms[roomID].localPlayers[0].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[0].y = Math.round(GC.gameHeight / 2);
            rooms[roomID].localPlayers[1].x = Math.round(2 * GC.gameWidth / 3);
            rooms[roomID].localPlayers[1].y = Math.round(GC.gameHeight / 2);
            break;
        case 4:
            rooms[roomID].localPlayers[0].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[0].y = Math.round(GC.gameHeight / 3);
            rooms[roomID].localPlayers[1].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[1].y = Math.round(2 * GC.gameHeight / 3);
            rooms[roomID].localPlayers[2].x = Math.round(2 * GC.gameWidth / 3);
            rooms[roomID].localPlayers[2].y = Math.round(GC.gameHeight / 3);
            rooms[roomID].localPlayers[3].x = Math.round(2 * GC.gameWidth / 3);
            rooms[roomID].localPlayers[3].y = Math.round(2 * GC.gameHeight / 3);
            break;
        case 6:
            rooms[roomID].localPlayers[0].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[0].y = Math.round(GC.gameHeight / 4);
            rooms[roomID].localPlayers[1].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[1].y = Math.round(2 * GC.gameHeight / 4);
            rooms[roomID].localPlayers[2].x = Math.round(GC.gameWidth / 3);
            rooms[roomID].localPlayers[2].y = Math.round(3 * GC.gameHeight / 4);
            rooms[roomID].localPlayers[3].x = Math.round(2 * GC.gameWidth / 3);
            rooms[roomID].localPlayers[3].y = Math.round(GC.gameHeight / 4);
            rooms[roomID].localPlayers[2].x = Math.round(2 * GC.gameWidth / 3);
            rooms[roomID].localPlayers[2].y = Math.round(2 * GC.gameHeight / 4);
            rooms[roomID].localPlayers[3].x = Math.round(2 * GC.gameWidth / 3);
            rooms[roomID].localPlayers[3].y = Math.round(3 * GC.gameHeight / 4);
            break;
    }
}

function PlaceBars(roomID) {
    var i; // counter
    var sideShift = 36;
    for(i = 0; i < rooms[roomID].bars.length; i++) {
        rooms[roomID].bars[i].x = Math.round(GC.gameWidth * (i % 2) + Math.pow(-1, i) * sideShift);
        if (i < 2) { rooms[roomID].bars[i].y = Math.round(GC.gameHeight / 2 - GC.goalSize / 2); }
        else { rooms[roomID].bars[i].y = Math.round(GC.gameHeight / 2 + GC.goalSize / 2 + 10); }
    }
}
function UpdateControl(userID, controls, hit) {
	for(var i = 0; i < rooms[players[userID].roomID].localPlayers.length; i++) {
		if(rooms[players[userID].roomID].localPlayers[i].playerID == userID) {
			rooms[players[userID].roomID].localPlayers[i].controls = controls;
			rooms[players[userID].roomID].localPlayers[i].hitPressed = hit;
		}
	}
}

function UpdateRoom (roomID) {
    var impulses = []; // Format: [objectIndex, dvx, dvy]. ObjectIndex of the ball = -1, players 0 to ...
    var tempImpulses;
    var i, j; // Counters
	
	// Calculate new speed for every player due to user commands (if not the goal already)
    // Limit speed for every player
    // Shift all players
    for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        if(!rooms[roomID].goal) HandleControl(rooms[roomID].localPlayers[i]);
        //console.log("Player coordinates: " + rooms[roomID].localPlayers[0].x + ", " + rooms[roomID].localPlayers[0].y);
        LimitSpeed(rooms[roomID].localPlayers[i]);
        Shift(rooms[roomID].localPlayers[i]);
    }
    // Enforce speed limit for the ball
    LimitSpeed(rooms[roomID].ball);
    // Shift the ball
    Shift(rooms[roomID].ball);
    // Check for goal (if not already)
    if(!rooms[roomID].goal) {
        rooms[roomID].goal = IsInGoal(rooms[roomID].ball);
        rooms[roomID].resetCounter = 100; // 2 seconds
    }
    else {
        tempImpulses = HandleGameBordersCollision(rooms[roomID].ball);
        if(tempImpulses[0] !== undefined) {
            impulses = impulses.concat(tempImpulses);
        }
        if(rooms[roomID].resetCounter <= 0) {
            ResetGame(roomID);
            rooms[roomID].resetCounter = 0;
        }
        rooms[roomID].resetCounter -= 1;
    }
    // Handle ball collisions with field borders
    tempImpulses = HandleFieldBordersCollision(rooms[roomID].ball);
    if(tempImpulses[0] !== undefined) {
        impulses = impulses.concat(tempImpulses);
    }
    // Handle players collisions with game borders
    for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        tempImpulses = HandleGameBordersCollision(rooms[roomID].localPlayers[i]);
        if(tempImpulses[0] !== undefined) {
            impulses = impulses.concat(tempImpulses);
        }
    }
    // Handle player-player collision
    // Handle player-player penetration
    for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        for(j = i + 1; j < rooms[roomID].localPlayers.length; j++) {
            tempImpulses = HandleObjectsCollision(rooms[roomID].localPlayers[i], rooms[roomID].localPlayers[j]);
            if(tempImpulses[0] !== undefined) {
                impulses = impulses.concat(tempImpulses);
            }
            HandleObjectsPenetration(rooms[roomID].localPlayers[i], rooms[roomID].localPlayers[j]);
        }
    }
    // Handle player-ball collision
    // Handle player-ball penetration
    // Handle player-ball strike
    for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        tempImpulses = HandleObjectsCollision(rooms[roomID].localPlayers[i], rooms[roomID].ball);
        if(tempImpulses[0] !== undefined) {
            impulses = impulses.concat(tempImpulses);
        }
        HandleObjectsPenetration(rooms[roomID].localPlayers[i], rooms[roomID].ball);
        tempImpulses = HandleStrike(rooms[roomID].localPlayers[i], rooms[roomID].ball);
        if(tempImpulses[0] !== undefined) {
            impulses = impulses.concat(tempImpulses);
        }
    }
    // Handle player-bar collision
    for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        for(j = 0; j < rooms[roomID].bars.length; j++) {
            tempImpulses = HandleObjectsCollision(rooms[roomID].localPlayers[i], rooms[roomID].bars[j]);
            if(tempImpulses[0] !== undefined) {
                impulses = impulses.concat(tempImpulses);
            }
            HandleObjectsPenetration(rooms[roomID].localPlayers[i], rooms[roomID].bars[j]);
        }
    }
    // Handle ball-bar collision
    for(j = 0; j < rooms[roomID].bars.length; j++) {
        tempImpulses = HandleObjectsCollision(rooms[roomID].ball, rooms[roomID].bars[j]);
        if(tempImpulses[0] !== undefined) {
            impulses = impulses.concat(tempImpulses);
        }
        HandleObjectsPenetration(rooms[roomID].ball, rooms[roomID].bars[j]);
    }
	// Apply impulses to all objects
	for(i = 0; i < impulses.length; i++)
	{
        if(impulses[i][0] === -1) { // impulses for the ball
            ApplyImpulses(rooms[roomID].ball, impulses[i]);
        }
        else { // impulses for players
            ApplyImpulses(rooms[roomID].localPlayers[impulses[i][0]], impulses[i])
        }
	}

	// Apply friction
	for(i = 0; i < rooms[roomID].localPlayers.length; i++) {
        ApplyFriction(rooms[roomID].localPlayers[i]);
	}
    ApplyFriction(rooms[roomID].ball);
}

function HandleControl(player) {
        if(player.controls[0] === true) {player.vx -= player.acceleration; }
        if(player.controls[1] === true) {player.vy -= player.acceleration; }
        if(player.controls[2] === true) {player.vx += player.acceleration; }
        if(player.controls[3] === true) {player.vy += player.acceleration; }
}

function LimitSpeed(gameObject) {
    var speed = Math.sqrt(gameObject.vx * gameObject.vx + gameObject.vy * gameObject.vy);
    if(speed > gameObject.maxSpeed) {
        gameObject.vx *= gameObject.maxSpeed / speed;
        gameObject.vy *= gameObject.maxSpeed / speed;
    }
}

function Shift(gameObject) {
    gameObject.x += gameObject.vx;
    gameObject.y += gameObject.vy;
}

function HandleFieldBordersCollision(gameObject) {
    var fieldGapWidth = (GC.gameWidth - GC.fieldWidth) / 2;
    var fieldGapHeight = (GC.gameHeight - GC.fieldHeight) / 2;
    var impulses = [];
    if((gameObject.x <= gameObject.size + fieldGapWidth || gameObject.x >= GC.gameWidth - gameObject.size - fieldGapWidth) &&
        (gameObject.y < Math.round(GC.gameHeight / 2 - GC.goalSize / 2) || gameObject.y > Math.round(GC.gameHeight / 2 + GC.goalSize / 2))) {
        if(gameObject.x <= gameObject.size + fieldGapWidth && gameObject.vx <= 0 ||
            gameObject.x >= GC.gameWidth - gameObject.size - fieldGapWidth && gameObject.vx >= 0) {
                impulses.push([-1, -(gameObject.bounceFactor + 1) * gameObject.vx, 0]);
        }

        if(gameObject.x <= gameObject.size + fieldGapWidth) gameObject.x = gameObject.size + fieldGapWidth;
        if(gameObject.x >= GC.gameWidth - gameObject.size - fieldGapWidth) gameObject.x = GC.gameWidth - gameObject.size - fieldGapWidth;
    }
    // Top and bottom walls:
    if(gameObject.y <= gameObject.size + fieldGapHeight || gameObject.y >= GC.gameHeight - gameObject.size - fieldGapHeight) {
        if(gameObject.y <= gameObject.size + fieldGapHeight && gameObject.vy <= 0 ||
            gameObject.y >= GC.gameHeight - gameObject.size - fieldGapHeight && gameObject.vy >= 0) {
                impulses.push([-1, 0, -(gameObject.bounceFactor + 1) * gameObject.vy]);
        }

        if(gameObject.y <= gameObject.size + fieldGapHeight) gameObject.y = gameObject.size + fieldGapHeight;
        if(gameObject.y >= GC.gameHeight - gameObject.size - fieldGapHeight) gameObject.y = GC.gameHeight - gameObject.size - fieldGapHeight;
    }
    return impulses;
}

function IsInGoal(gameObject) {
    var fieldGapWidth = (GC.gameWidth - GC.fieldWidth) / 2;
    var goal = false;
    if(gameObject.y > Math.round(GC.gameHeight / 2 - GC.goalSize / 2)
        && gameObject.y < Math.round(GC.gameHeight / 2 + GC.goalSize / 2)
        && gameObject.x <= fieldGapWidth) {
        rooms[gameObject.roomID].score[1] += 1;
        goal = true;
    }
    if(gameObject.y > Math.round(GC.gameHeight / 2 - GC.goalSize / 2)
        && gameObject.y < Math.round(GC.gameHeight / 2 + GC.goalSize / 2)
        && gameObject.x >= GC.gameWidth - fieldGapWidth) {
        rooms[gameObject.roomID].score[0] += 1;
        goal = true;
    }
    return goal;
}
function HandleGameBordersCollision(gameObject) {
    var impulses = [];
    if(gameObject.x <= gameObject.size || gameObject.x >= GC.gameWidth - gameObject.size) {
        if(gameObject.x <= gameObject.size && gameObject.vx <= 0 || gameObject.x >= GC.gameWidth - gameObject.size && gameObject.vx >= 0) {
            impulses.push([gameObject.indexInRoom, -(gameObject.bounceFactor + 1) * gameObject.vx, 0]);
        }

        if(gameObject.x <= gameObject.size) gameObject.x = gameObject.size;
        if(gameObject.x >= GC.gameWidth - gameObject.size) gameObject.x = GC.gameWidth - gameObject.size;
    }
    // // Top and bottom walls:
    if(gameObject.y <= gameObject.size || gameObject.y >= GC.gameHeight - gameObject.size) {
        if(gameObject.y <= gameObject.size && gameObject.vy <= 0 || gameObject.y >= GC.gameHeight - gameObject.size && gameObject.vy >= 0) {
            impulses.push([gameObject.indexInRoom, 0, -(gameObject.bounceFactor + 1) * gameObject.vy]);
        }

        if(gameObject.y <= gameObject.size) gameObject.y = gameObject.size;
        if(gameObject.y >= GC.gameHeight - gameObject.size) gameObject.y = GC.gameHeight - gameObject.size;
    }
    return impulses;
}

function HandleObjectsCollision(gameObject1, gameObject2) {
    // Temp variables to shorten code
    var x1  = gameObject1.x;
    var y1  = gameObject1.y;
    var vx1 = gameObject1.vx;
    var vy1 = gameObject1.vy;
    var x2  = gameObject2.x;
    var y2  = gameObject2.y;
    var vx2 = gameObject2.vx;
    var vy2 = gameObject2.vy;
    var mass1 = gameObject1.mass;
    var mass2 = gameObject2.mass;
    var impulses = [];

    var distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    if(distance < gameObject1.size + gameObject2.size) {
        // collision!
        var dx = x1 - x2;
        var dy = y1 - y2;
        var angle = Math.atan2(dy, dx);
        var mag1 = Math.sqrt(vx1 * vx1 + vy1 * vy1);
        var mag2 = Math.sqrt(vx2 * vx2 + vy2 * vy2);
        var dir1 = Math.atan2(vy1, vx1);
        var dir2 = Math.atan2(vy2, vx2);
        var newvx1 = mag1 * Math.cos(dir1 - angle);
        var newvy1 = mag1 * Math.sin(dir1 - angle);
        var newvx2 = mag2 * Math.cos(dir2 - angle);
        var newvy2 = mag2 * Math.sin(dir2 - angle);
        var finvx1 = ((mass1 - mass2) * newvx1 + 2 * mass2 * newvx2) / (mass1 + mass2);
        var finvx2 = (2 * mass1 * newvx1 + (mass2 - mass1) * newvx2) / (mass1 + mass2);
        var finvy1 = newvy1;
        var finvy2 = newvy2;
        var deltavx1 = (Math.cos(angle) * finvx1 + Math.cos(angle + Math.PI / 2) * finvy1) - vx1;
        var deltavy1 = (Math.sin(angle) * finvx1 + Math.sin(angle + Math.PI / 2) * finvy1) - vy1;
        var deltavx2 = (Math.cos(angle) * finvx2 + Math.cos(angle + Math.PI / 2) * finvy2) - vx2;
        var deltavy2 = (Math.sin(angle) * finvx2 + Math.sin(angle + Math.PI / 2) * finvy2) - vy2;

        if(!gameObject1.static) {
            impulses.push([gameObject1.indexInRoom, deltavx1, deltavy1]);
        }
        if(!gameObject2.static) {
            impulses.push([gameObject2.indexInRoom, deltavx2, deltavy2]);
        }
    }
    return impulses;
}

function HandleObjectsPenetration(gameObject1, gameObject2) {
    // Temp variables to shorten code
    var x1  = gameObject1.x;
    var y1  = gameObject1.y;
    var x2  = gameObject2.x;
    var y2  = gameObject2.y;

    var distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    if(distance < gameObject1.size + gameObject2.size) {
        // collision!
        var penetrationDepth = gameObject1.size + gameObject2.size - distance;
        var pushDistance = penetrationDepth / 2;
        var dx = x2 - x1;
        var dy = y2 - y1;
        var angle = Math.atan2(dy, dx);
        var dx1 = pushDistance * Math.cos(angle);
        var dx2 = - dx1;
        var dy1 = pushDistance * Math.sin(angle);
        var dy2 = - dy1;
        if(!gameObject1.static) {
            gameObject1.x -= dx1;
            gameObject1.y -= dy1;
        }
        if(!gameObject2.static) {
            gameObject2.x -= dx2;
            gameObject2.y -= dy2;
        }
    }
}

function HandleStrike(gameObject1, gameObject2) {
    var impulses = [];
    // Temp variables to shorten code
    var x1  = gameObject1.x;
    var y1  = gameObject1.y;
    var x2  = gameObject2.x;
    var y2  = gameObject2.y;
    // Handle ball hit
    var distance = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    if(distance < gameObject1.size + gameObject2.size + gameObject1.strikeDistance && gameObject1.hitPressed === true) {
        // Ball was hit!
        var dx = x2 - x1;
        var dy = y2 - y1;
        var angle = Math.atan2(dy, dx);
        var deltavx1 = gameObject1.hitStrength * Math.cos(angle);
        var deltavy1 = gameObject1.hitStrength * Math.sin(angle);

        impulses.push([-1, deltavx1, deltavy1]);
        gameObject1.hitPerformed = true;
        gameObject1.hitPressed = false;
    }
    else {
        gameObject1.hitPerformed = false;
    }
    return impulses;
}

function ApplyImpulses(gameObject, impulse) {
    gameObject.vx += impulse[1];
    gameObject.vy += impulse[2];
}

function ApplyFriction(gameObject) {
    gameObject.vx *= gameObject.frictionFactor;
    gameObject.vy *= gameObject.frictionFactor;
}