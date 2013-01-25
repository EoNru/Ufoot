var System = require("sys");
var http = require('http');
var WebSocketServer = require('C:/Users/EoN/node_modules/websocket').server;
var Game = require("D:/xampp/htdocs/projects/Football/game");

var Connections = {};
var MaxConnections = 500;
var server = http.createServer(function(request, response) {
                Response.writeHead(200, { "Content-Type": "text/plain" });
                Response.end();
            });
// Listen on port 9001
server.listen(9001, function(){
    console.log('Server has started listening on port 9001');
});

// Attach WebSocket Server to HTTP Server
var wsServer = new WebSocketServer({
    httpServer: server,
    closeTimeout: 2000
});

// Logic to determine whether a specified connection is allowed.
function connectionIsAllowed(request) {
    // Check criteria such as request.origin, request.remoteAddress
    return ObjectSize(Connections) < MaxConnections;

}

// Handle WebSocket Connection Requests
wsServer.on("request", function(request) {
    // Reject requests based on certain criteria
    if(!connectionIsAllowed(request)){
        request.reject();
        console.log('WebSocket connection from ' + request.remoteAddress + ' rejected.');
        return;
    }
    // Accept Connection
    var connection = request.accept();
    connection.IP = request.remoteAddress;
    console.log('Websocket connection from ' + connection.IP + ' accepted.');

    connection.on("message", function(Message) {
        if (Message.type == "utf8") {
            HandleClientMessage(Message.utf8Data, connection);
        }
    });
    
    connection.on('close', function(reasonCode, description) {
        HandleClientClosure(connection.ID);
        console.log('WebSocket Connection from ' + request.remoteAddress + ' closed.');
    });
});

function HandleClientMessage(Message, connection) {
    try {var message = JSON.parse(Message); }
    catch (Err) {return;}
    switch (message.Type) {
        case "Join": // Client started the game
            Connections[message.VKid] = connection;
            System.log("Player ID = " + message.VKid);
            Game.AddNewPlayer(message.VKid, message.Name);
            break;
        case "WP":
            Game.AddNewPlayer(message.VKid);
            break;
        case "Name":
            Game.ChangePlayerName(message.UserID, message.PlayerName);
            break;
        case "Cancel":
            Game.DeletePlayer(message.UserID);
            break;
        case "Control":
            Game.UpdateControl(message.VKid, message.Controls, message.Hit);
            break;
    }
}

function HandleClientClosure (ID) {
    delete Connections[ID];
}

setInterval(function() {
    for(var roomID in Game.rooms) {
        if(Game.rooms[roomID].full) {
            Game.UpdateRoom(roomID);
        }
        for(var i = 0; i < Game.rooms[roomID].localPlayers.length; i++) {
            Connections[Game.rooms[roomID].localPlayers[i].playerID].send(JSON.stringify({Type: "GS", State: Game.rooms[roomID]}));
        }
    }
}, Game.GC.frameTime);

function ObjectSize(Obj)
{
    var Size = 0;
    for (var Key in Obj)
        if (Obj.hasOwnProperty(Key))
            Size++;
            
    return Size;
}