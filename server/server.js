var http = require('http'),
    crypto = require('crypto');
var server = http.createServer(function(request, response) {
    response.writeHead(200, {"Connection": "Upgrade"});
    response.end();
});
server.listen(8888, function() {
    console.log((new Date()) + ' Server is listening on port 8888');
});

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
    httpServer: server
});

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex');
}

function checkHash(id, hash) {
    if(md5(salt+id) == hash){
        return true;
    } else {
        return false;
    }
}

var salt = crypto.randomBytes(128).toString('base64');
var count = 0;
var clients = {};
var request_clients = [];
var messages = [];

console.log((new Date()) + ' Salt for this session is ' + salt);

wsServer.on('request', function(r){
    var connection = r.accept('echo-protocol', r.origin);

    var id = count++;

    clients[id] = connection;
    console.log((new Date()) + ' Connection accepted [' + id + ']');
    clients[id].sendUTF(JSON.stringify({"type": "id", "id": id, "hash": md5(salt+id)}));

    connection.on('message', function(message) {
        var data = JSON.parse(message.utf8Data);
        switch(data.type){
            case "message" || "picture":
                var contents;
                if(data.type == message){
                    contents = data.message;
                }else{
                    contents = data.url;
                }
                console.log((new Date()) + ' New ' + data.type + ' sent from ' + data.from.id + ' to ' + data.to.id + ': ' + data.message);
                if(checkHash(data.from.id, data.from.hash) && checkHash(data.to.id, data.to.hash)){
                    if(clients[data.to.id]){
                        clients[data.to.id].sendUTF(message.utf8Data);
                        clients[data.from.id].sendUTF(message.utf8Data);
                        messages.push(message.uft8Data);
                    }else{
                        clients[data.from.id].sendUTF(JSON.stringify({"type": "disconnected", "message": "You've been disconnected because your partner closed their browser window. Please wait, we're reconnecting you to a new partner now. If you don't want to be reconnected, just close your browser window.", "from": {"id": "system", "hash": ""}, "to": {"id": data.from.id, "hash": ""}}));
                    }
                }else{
                    console.log((new Date()) + ' Client hashes invalid, alerting sender and intended recipient.');
                    clients[data.from.id].sendUTF(JSON.stringify({"type": "message", "message": "Our system has detected that you attempted to reroute your message by modifying the Javascript variables. This is not allowed, and subsequent attempts may result in a ban. The user you attempted to contact has also been notified.", "from": {"id": "system", "hash": ""}, "to": {"id": data.to.id, "hash": ""}}));
                    clients[data.to.id].sendUTF(JSON.stringify({"type": "message", "message": "Someone you are not chatting with just attempted to send you a message by exploiting our system, however we detected it and blocked the message. If you recieve any subsequent messages that seem unusual, please be sure to report them.", "from": {"id": "system", "hash": ""}, "to": {"id": data.to.id, "hash": ""}}));
                } 
                break;
            case "requestpartner":
                console.log((new Date()) + ' Client ' + data.from.id + ' requesting new partner.');
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
                        console.log((new Date()) + ' Partnered ' + partner + ' with ' + data.from.id + ' and removed ' + partner + ' from request_clients.');
                        clients[data.from.id].sendUTF(JSON.stringify({"type": "partner", "id": partner, "hash": md5(salt+partner)}));
                        clients[partner].sendUTF(JSON.stringify({"type": "partner", "id": data.from.id, "hash": md5(salt+data.from.id)}));
                    }
                }else{
                    console.log((new Date()) + ' Client hash invalid, request refused and client notified.');
                    clients[data.from.id].sendUTF(JSON.stringify({"type": "message", "message": "Your request for a new partner has been denied as your hash and ID do not match. This could mean that someone has attempted to request a new partner on your behalf.", "from": {"id": "system", "hash": ""}, "to": {"id": data.to.id, "hash": ""}}));
                }
                break;
            case "disconnect":
                console.log((new Date()) + ' Client ' + data.from.id + ' requesting disconnect from ' + data.partner.id);
                if(checkHash(data.from.id, data.from.hash) && checkHash(data.partner.id, data.partner.hash)){
                    clients[data.from.id].sendUTF(JSON.stringify({"type": "disconnected", "message": "You've been disconnected. Please wait, we're reconnecting you to a new partner now. If you don't want to be reconnected, just close your browser window.", "from": {"id": "system", "hash": ""}, "to": {"id": data.from.id, "hash": ""}}));
                    clients[data.partner.id].sendUTF(JSON.stringify({"type": "disconnected", "message": "You've been disconnected. Please wait, we're reconnecting you to a new partner now. If you don't want to be reconnected, just close your browser window.", "from": {"id": "system", "hash": ""}, "to": {"id": data.partner.id, "hash": ""}}));
                }else{
                    console.log((new Date()) + ' Client hashes invalid, alerting sender and intended recipient.');
                    clients[data.from.id].sendUTF(JSON.stringify({"type": "message", "message": "Our system has detected that you attempted to disconnect someone other than yourself. This is against the rules, and further attempts will result in a ban. The person you attempted to disconnect has been notified.", "from": {"id": "system", "hash": ""}, "to": {"id": data.from.id, "hash": ""}}));
                    clients[data.partner.id].sendUTF(JSON.stringify({"type": "message", "message": "Someone you are not chatting with just attempted disconnect from your current partner by exploiting our system, however we detected it and blocked it.", "from": {"id": "system", "hash": ""}, "to": {"id": data.partner.id, "hash": ""}}));
                }
                break;
            case "stats":
            	console.log((new Date()) + ' Client ' + data.from.id + ' requesting stats');
            	if(checkHash(data.from.id, data.from.hash)){
            		clients[data.from.id].sendUTF(JSON.stringify({"type": "stats", "user_count": Object.keys(clients).length, "message_count": messages.length, "from": {"id": "system", "hash": ""}, "to": {"id": data.from.id, "hash": ""}}));
            	}else{
            		console.log((new Date()) + ' Client hash invalid, request refused and client notified.');
            		clients[data.from.id].sendUTF(JSON.stringify({"type": "message", "message": "Your request for stats has been denied as your hash and ID do not match.", "from": {"id": "system", "hash": ""}, "to": {"id": data.from.id, "hash": ""}}));
            	}
        }
        
    });
    connection.on('close', function(reasonCode, description) {
        delete clients[id];
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

setInterval(function() {
	console.log((new Date()) + ' Stats: ' + Object.keys(clients).length + ' users, ' + messages.length + ' messages.');
}, 10000);
