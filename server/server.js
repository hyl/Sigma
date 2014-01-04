var http = require("http"),
    crypto = require("crypto"),
    clc = require("cli-color"),
    success = clc.bgGreen,
    info = clc.bgBlue,
    error = clc.bgRed,
    stats = clc.bgYellow,
    salt = crypto.randomBytes(16).toString("base64"),
    count = 0,
    messages = 0,
    clients = {},
    request_clients = [],
    stat_interval = 10000;

var server = http.createServer(function(request, response) {
    response.writeHead(200, {"Connection": "Upgrade"});
    response.end();
});
server.listen(8888, function() {
    log("success", "Server is listening on port 8888");
});

var WebSocketServer = require("websocket").server;
wsServer = new WebSocketServer({
    httpServer: server
});

function md5(string) {
  return crypto.createHash("md5").update(string).digest("hex");
}

function checkHash(id, hash) {
    if(md5(salt+id) == hash){
        return true;
    } else {
        return false;
    }
}

function log(type, message){
    switch(type){
        case "success":
            console.log(new Date() + " " + success("[SUCCESS]") + " " + message);
            break;
        case "info":
            console.log(new Date() + " " + info("[INFO]") + " " + message);
            break;
        case "error":
            console.log(new Date() + " " + error("[ERROR]") + " " + message);
            break;
        case "stats":
            console.log(new Date() + " " + stats("[STATS]") + " " + message);
            break;
    }
    
}
 
function send(from, to, message){
    if(from.id == "server"){
        if(clients[to.id]){
            clients[to.id].sendUTF(message);
        } else {
            log("error", "Server attempted to send a request to " + to.id + " which does not exist");
        }
    } else {
        if(checkHash(from.id, from.hash) && checkHash(to.id, to.hash)){
            if(clients[to.id]){
                clients[to.id].sendUTF(message);
                clients[from.id].sendUTF(message);
                messages++;
            } else {
                log("error", "Client " + from.id + " attempted to send a request to " + to.id + " which does not exist");
                clients[from.id].sendUTF(JSON.stringify({"type": "disconnected", "message": "You've been disconnected because your partner closed their browser window. Please wait, we're reconnecting you to a new partner now. If you don't want to be reconnected, just close your browser window."}));
            }
        } else {
            log("error", "Client " + from.id + " attempted to send to a request with an invalid hash to " + to.id);
            clients[from.id].sendUTF(JSON.stringify({"type": "message", "message": "Your client/partner hash does not match so your message could not be sent. If this error continutes please refresh your page."}));
        }
    }
}

log("info", "Salt for this session is " + salt);

wsServer.on("request", function(r){
    var connection = r.accept("echo-protocol", r.origin);

    var id = count++;

    clients[id] = connection;
    log("success", "Connection accepted for client " + id);
    clients[id].sendUTF(JSON.stringify({"type": "id", "id": id, "hash": md5(salt+id)}));

    connection.on("message", function(message) {
        var data = JSON.parse(message.utf8Data);
        switch(data.type){
            case "message": case "picture":
                if(data.type == "picture"){
                    log("success", "Recieved picture with URL of " + data.url + ", sending on...");
                }
                send({"id": data.from.id, "hash": data.from.hash}, {"id": data.to.id, "hash": data.to.hash}, message.utf8Data); 
                break;
            case "requestpartner":
                log("info", "Client " + data.from.id + " requesting new partner.");
                if(checkHash(data.from.id, data.from.hash)){
                    if(request_clients.length === 0) {
                        request_clients.push(data.from.id);
                        clients[data.from.id].sendUTF(JSON.stringify({"type": "status", "message": "Sorry, it looks like everyone else is already chatting with someone. We've added you to the waiting list so you will be connected as soon as someone becomes available.", "from": {"id": "system", "hash": ""}, "to": {"id": data.from.id, "hash": ""}}));
                    } else{
                        var partner = request_clients[Math.floor(Math.random() * request_clients.length)];
                        var i = request_clients.indexOf(partner);
                        if(i != -1) {
                            request_clients.splice(i, 1);
                        }
                        log("success", "Partnered " + partner + " with " + data.from.id + " and removed " + partner + " from request list");
                        clients[data.from.id].sendUTF(JSON.stringify({"type": "partner", "id": partner, "hash": md5(salt+partner)}));
                        clients[partner].sendUTF(JSON.stringify({"type": "partner", "id": data.from.id, "hash": md5(salt+data.from.id)}));
                    }
                }else{
                    log("error", "Partner request denied as client hashes are invalid, client notified");
                    clients[data.from.id].sendUTF(JSON.stringify({"type": "message", "message": "Your request for a new partner has been denied as your hash and ID do not match. This could mean that someone has attempted to request a new partner on your behalf.", "from": {"id": "system", "hash": ""}, "to": {"id": data.to.id, "hash": ""}}));
                }
                break;
            case "disconnect":
                log("info", "Client " + data.from.id + " requesting disconnect from " + data.to.id);
                send({"id": data.from.id, "hash": data.from.hash}, {"id": data.to.id, "hash": data.to.hash}, message.uft8Data);
                break;
            case "stats":
                log("info", "Client " + data.from.id + " requesting stats");
                send({"id": "server"}, {"id": data.from.id}, JSON.stringify({"type": "stats", "user_count": Object.keys(clients).length, "message_count": messages}));
                break;
            case "typing":
                log("info", "Client " + data.from.id + " is typing while in a conversation with " + data.to.id);
                send({"id": "server"}, {"id": data.to.id, "hash": data.to.hash}, JSON.stringify({"type": "typing"}));
                break;
        }
        
    });
    connection.on("close", function(reasonCode, description) {
        delete clients[id];
        log("info", "Client " + connection.remoteAddress + " disconnected");
    });
});

setInterval(function() {
    log("stats", "Stats: " + Object.keys(clients).length + " users, " + messages + " messages");
}, stat_interval);
