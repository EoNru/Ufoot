var GP = { //Game parameters
    frameTime: 20, //milliseconds
    maxPlayers: 2,
    score: {your: 0, their: 0},
    WAITING: 0,
    RUNNING: 1,
    status: null,

    //User inputs
    arrowLeft: 37,
    arrowUp: 38,
    arrowRight: 39,
    arrowDown: 40,
    spaceButton: 32,
    moveDirections: [], //0 - left, 1 - up, 2 - right, 3 - down

    //GameUI
    ui: $("gameUI"),
    uiHeader: $("gameHeader"),
    uiResult: $("gameResult"),
    uiStartGame: $("#startGame"),
    uiMenu: $("gameMenu"),
    uiScore: $("gameScore"),
    uiSettings: $("gameSettings"),
    uiChat: $("gameChat")
};

var canvas;
var graphicsContext;
var gameRoom = null;
var myPlayer = null;
var myName = "Noname";
var teammates = [];
var enemies = [];
var gameTimer = null;
var Socket = null;
var soundPlaying = false;
var VKid = Math.floor(Math.random() * 10000);
var fieldImage = new Image();
fieldImage.src = "field2.png";
var hitCounter = 0;
var soundCounter;

var soundGoal = document.createElement('audio');
soundGoal.setAttribute('src', 'sounds/cheer.mp3');

var soundMusic = document.createElement('audio');
soundMusic.setAttribute('src', 'sounds/beatbackground.wav');
soundMusic.setAttribute('loop', 'loop');
soundMusic.volume = 0;
/*var playerImage = new Image();
playerImage.src = "player.png";*/

$(document).ready(function() {
    Init();
    InitWebConnection();
    myName = prompt("Введите свое имя", "Игрок " + VKid);
});

function Init() {
    /*uiHeader.hide();
    uiResult.hide();
    uiScore.hide();
    uiSettings.hide();
    uiMenu.show();*/

    //Canvas parameters
    canvas = $("#gameCanvas");
    graphicsContext = canvas.get(0).getContext("2d");

    $("#startGame").click(function(e) {
        e.preventDefault();
        if(Socket !== null) {
            $("#gameUI").hide(500);
            GP.status = "pregame";
            Socket.send(JSON.stringify({Type: "Join", VKid: VKid, Name: myName}));
            //$("#title").text(GP.status);
            gameTimer = setInterval(
            function() { UpdateAnimation(); },
            GP.frameTime);
        }
    });

    $("#settings").click(function(e) {
        e.preventDefault();
    });
    $("#shopButton").click(function(e) {
        e.preventDefault();
    });
    $("#stats").click(function(e) {
        e.preventDefault();
    });
}

function InitWebConnection() {
    // if user is running mozilla then use it's built-in WebSocket
    var WebSocketObject = WebSocket || MozWebSocket;
    if (WebSocketObject) {
        Socket = new WebSocketObject("ws://188.32.221.178:9001");
        // Socket = new WebSocketObject("ws://109.120.169.143:9001");
        // Socket = new WebSocketObject("ws://localhost:9001/");
        Socket.onopen = function () {
            // connection is opened and ready to use
            $("#gameLog").text("I think websocket opened!");
        };

        Socket.onerror = function (error) {
            // an error occurred when sending/receiving data
            alert("WebSocket error:" + JSON.stringify(error));
        };

        Socket.onclose = function() {
            //alert("Connection closed!!!");
        };

        Socket.onmessage = function (message) {
            // try to decode json (I assume that each message from server is json)
            var json;
            try {
                json = JSON.parse(message.data);
            } catch (e) {
                console.log('This doesn\'t look like a valid JSON: ', message.data);
                return;
            }
            // handle incoming message
            HandleServerMessage(json);
        };
    }
    else
    {
        Socket = null;
        alert("Ваш браузер не поддерживает эту игру. Мы рекомендуем использовать " +
               "более современные браузеры, например Google Chrome или Mozilla Firefox.");
    }
}

function HandleServerMessage(message) {
    switch(message.Type) {
        case "GS": // Game state
            // $("#gameLog").text(message.State.full);
            if(message.State !== null) { gameRoom = message.State;} // copy server room to client
            if(GP.status == "game") {
                SetRoomState();
                if(gameRoom.goal === true){
                    if(!soundPlaying) {
                        soundGoal.volume = 0;
                        soundGoal.play();
                        soundPlaying = true;
                        soundCounter = 100; // 2 seconds delay
                    }
                }
                if(soundPlaying) {
                    soundCounter -= 1;
                    if(soundCounter < 0) {
                        soundPlaying = false;
                    }
                }
            }
            if (gameRoom.full && GP.status != "game") {
                GP.status = "game";
                // $("#gameLog").text("Your ID: " + VKid);
                InitGame();
            }
            break;
        case "Chat":
            break;
    }
}

function UpdateAnimation() {
    if(GP.status == "pregame") {
        DrawLoadingScreen();
    }
    if(GP.status == "game") {
        DrawGame();
    }
}

function DrawLoadingScreen() {
    var i; // counter
    graphicsContext.clearRect(0, 0, canvas.width(), canvas.height());
    //graphicsContext.drawImage(fieldImage, -fieldImage.width / 2, -fieldImage.height / 2);
    graphicsContext.drawImage(fieldImage, 0, 0);
    //graphicsContext.drawImage(playerImage, 0, 0);
    graphicsContext.font = "16pt Arial";
    graphicsContext.textAlign = "center";
    graphicsContext.fillText("Ожидание соперников: " + gameRoom.localPlayers.length + "/" + gameRoom.capacity,
                             canvas.width() / 2, canvas.height() / 2);

    for(i = 0; i < gameRoom.capacity; i++) {
        graphicsContext.save();
        if(gameRoom.capacity % 2) {
            graphicsContext.translate(canvas.width() * (0.5 + (i - gameRoom.capacity / 2 + 0.5) * 0.1), canvas.height() * 0.55);
        }
        else {
            graphicsContext.translate(canvas.width() * (0.5 + (i - (gameRoom.capacity - 1) / 2) * 0.1), canvas.height() * 0.55);
        }
        if(i < gameRoom.localPlayers.length) {
            graphicsContext.fillStyle = "red";
        }
        else {
            graphicsContext.fillStyle = "black";
        }
        graphicsContext.beginPath();
        graphicsContext.arc(0, 0, 8, 0, Math.PI * 2);
        graphicsContext.closePath();
        graphicsContext.fill();
        graphicsContext.restore();
    }
}

function DrawGame () {
    var i; // counter
    var color;
    $("#gameLog").text("Red:  " + gameRoom.score[0] + "  -  " + gameRoom.score[1] + "  : Blue");
    graphicsContext.clearRect(0, 0, canvas.width(), canvas.height());
    // Draw field
    graphicsContext.drawImage(fieldImage, 0, 0);
    // Draw myself
    DrawPlayer(myPlayer);
    for(i = 0; i < teammates.length; i++) {
        DrawPlayer(teammates[i]);
    }
    for(i = 0; i < enemies.length; i++) {
        DrawPlayer(enemies[i]);
    }
    DrawBall(gameRoom.ball);
    // Draw lines
    for(i = 0; i < 2; i++) {
        graphicsContext.beginPath();
        graphicsContext.moveTo(gameRoom.bars[i].x, gameRoom.bars[i].y);
        graphicsContext.lineTo(gameRoom.bars[i + 2].x, gameRoom.bars[i + 2].y);
        if(i < 1) {color = "red"; }
        else {color = "blue"; }
        graphicsContext.lineWidth = 5;
        graphicsContext.strokeStyle = color;
        graphicsContext.stroke();
    }
    // Draw bars
    for(i = 0; i < gameRoom.bars.length; i++) {
        graphicsContext.save();
        graphicsContext.translate(gameRoom.bars[i].x, gameRoom.bars[i].y);
        graphicsContext.fillStyle = "#646454";
        graphicsContext.beginPath();
        graphicsContext.arc(0, 0, gameRoom.bars[i].size, 0, Math.PI * 2);
        graphicsContext.closePath();
        graphicsContext.fill();
        graphicsContext.restore();
    }
}

function DrawPlayer(gameObject) {
    graphicsContext.save();
    graphicsContext.translate(gameObject.x, gameObject.y);
    if(gameObject.hitPerformed === true) {
        gameObject.hitCounter = 18;
    }
    if(gameObject.hitCounter > 0) {
        gameObject.hitCounter -= 1;
        graphicsContext.fillStyle = "white";
        graphicsContext.beginPath();
        graphicsContext.arc(0, 0, gameObject.size + 2, 0, Math.PI * 2);
        graphicsContext.closePath();
        graphicsContext.fill();
    }
    graphicsContext.fillStyle = gameObject.outerColor;
    graphicsContext.beginPath();
    graphicsContext.arc(0, 0, gameObject.size, 0, Math.PI * 2);
    graphicsContext.closePath();
    graphicsContext.fill();
    graphicsContext.fillStyle = gameObject.innerColor;
    graphicsContext.beginPath();
    graphicsContext.arc(0, 0, gameObject.size - 6, 0, Math.PI * 2);
    graphicsContext.closePath();
    graphicsContext.fill();
    graphicsContext.font = "14pt Arial";
    graphicsContext.fillStyle = "black";
    graphicsContext.textAlign = "center";
    graphicsContext.fillText(gameObject.name.substring(0, 12), 0, gameObject.size + 15);
    graphicsContext.restore();
}

function DrawBall(gameObject) {
    // Draw the ball
    graphicsContext.save();
    graphicsContext.translate(gameObject.x, gameObject.y);
    graphicsContext.fillStyle = gameObject.outerColor;
    graphicsContext.beginPath();
    graphicsContext.arc(0, 0, gameObject.size, 0, Math.PI * 2);
    graphicsContext.closePath();
    graphicsContext.fill();
    graphicsContext.fillStyle = gameObject.innerColor;
    graphicsContext.beginPath();
    graphicsContext.arc(0, 0, gameObject.size - 2, 0, Math.PI * 2);
    graphicsContext.closePath();
    graphicsContext.fill();
    graphicsContext.restore();
}

function InitGame() {
    var i; // counter
    SetRoomState();
    soundMusic.play();
    //User control handle
    for(i = 0; i < 4; i++) {
        GP.moveDirections[i] = false;
    }
    var hit = false;
    $(window).keydown( function(E) {
        var Transmit = false;
        if(E.keyCode == GP.arrowLeft) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[0] = true;
        } else if(E.keyCode == GP.arrowRight) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[2] = true;
        }

        if(E.keyCode == GP.arrowUp) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[1] = true;
        } else if(E.keyCode == GP.arrowDown) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[3] = true;
        }

        if(Transmit && Socket && Socket.readyState == 1) {
            Socket.send(JSON.stringify({Type: "Control", VKid: VKid, Controls: GP.moveDirections, Hit: hit}));
        }
    });

    $(window).keyup( function(E) {
        var Transmit = false;
        if(E.keyCode == GP.arrowLeft) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[0] = false;
        }
        if(E.keyCode == GP.arrowRight) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[2] = false;
        }

        if(E.keyCode == GP.arrowUp) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[1] = false;
        }
        if(E.keyCode == GP.arrowDown) {
            E.preventDefault();
            Transmit = true;
            GP.moveDirections[3] = false;
        }

        if(E.keyCode == GP.spaceButton) {
            E.preventDefault();
            Transmit = true;
            hit = true;
        }
        if(Transmit && Socket && Socket.readyState == 1) {
            Socket.send(JSON.stringify({Type: "Control", VKid: VKid, Controls: GP.moveDirections, Hit: hit}));
            hit = false;
        }
    });
}

function SetRoomState() {
    var i;
    teammates.length = 0;
    enemies.length = 0;
    for(i = 0; i < gameRoom.localPlayers.length; i++) {
        if(gameRoom.localPlayers[i].playerID == VKid) {
            myPlayer = gameRoom.localPlayers[i];
        }
    }
    for(i = 0; i < gameRoom.localPlayers.length; i++) {
        if(gameRoom.localPlayers[i].playerID == VKid) continue;
        if(gameRoom.localPlayers[i].team == myPlayer.team) {
            teammates.push(gameRoom.localPlayers[i]);
        }
        else {
            enemies.push(gameRoom.localPlayers[i]);
        }
    }
    SetColors();
}

function SetColors() {
    var color1, color2; // temp variable to store color
    if(myPlayer.team === 1) {
        color1 = "red";
        color2 = "blue";
    }
    else {
        color1 = "blue";
        color2 = "red";
    }
    myPlayer.outerColor = color1;
    myPlayer.innerColor = "white";
    for(i = 0; i < teammates.length; i++) {
        teammates[i].outerColor = color1;
        teammates[i].innerColor = "black";
    }
    for(i = 0; i < enemies.length; i++) {
        enemies[i].outerColor = color2;
        enemies[i].innerColor = "black";
    }
    gameRoom.ball.outerColor = "white";
    gameRoom.ball.innerColor = "black";
}