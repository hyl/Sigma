$("#chat, #typing, #footer").hide();
$("#startchat").click(function(){
	$("#intro").fadeOut(function(){
		$("#chat, #footer").fadeIn();
			connect();
	});
});
var client = {"self": {"id": null, "hash": null, "automessage": {"asl": null, "name": null, "email": null, "kik": null, "skype": null}, "settings": {"hide_buttons": true}}, "partner": {"id": null, "hash": null, "automessage": {"asl": null, "name": null, "email": null, "kik": null, "skype": null}}};
function connect(){
	var ws = new WebSocket('ws://109.74.195.222:8888', 'echo-protocol');
	var focused;
	var unread = 0;
	/* ========== WEBSOCKET STUFF ========== */
	switch (ws.readyState) {
	  case WebSocket.CONNECTING:
	    $("#status").html("<strong>Connecting to the chat server...</strong>");
	    setDisabled(true);
	    break;
	  case WebSocket.CLOSED:
	    $("#status").html("<strong>Disconnected from chat server...</strong>");
	    setDisabled(true);
	    break;
	}
	ws.addEventListener("message", function(e) {
		(e);
		var data = JSON.parse(e.data);
		switch(data.type){
			case "message":
				window.scrollTo(0,document.body.scrollHeight);
				var time = new Date(),
	    			hours = pad(time.getHours()),
	    			minutes = pad(time.getMinutes());
	    		var from;
	    		if(data.from.id == client.self.id){
	    			from = "You";
	    		}else if(data.from.id == client.partner.id){
	    			from = "Partner";
	    		}else{
	    			from = "System";
	    		}
	    		$('#chat').append('<li class="list-group-item"><span class="label label-primary pull-right">' + hours + ':' + minutes + '</span><b>' + from + ':</b> ' + replaceURLWithHTMLLinks(data.message) + '</li>');
	    		if(!focused){
	    			unread++;
					document.title = "(" + unread + ") Σigma - Chat to random strangers";
	    		}
	    		requestStats();
	    		break;
	    	case "picture":
	    		window.scrollTo(0,document.body.scrollHeight);
	    		var time = new Date(),
	    			hours = pad(time.getHours()),
	    			minutes = pad(time.getMinutes());
	    		if(data.from.id == client.self.id){
	    			from = "You";
	    		}else if(data.from.id == client.partner.id){
	    			from = "Partner";
	    		}else{
	    			from = "System";
	    		}
	    		$('#chat').append('<li class="list-group-item"><span class="label label-primary pull-right">' + hours + ':' + minutes + '</span><b>' + from + ':</b> <img src="' + data.url + '" alt="What is the meaning of life?" width="100px" height="auto"></li>');
	    		if(!focused){
	    			unread++;
					document.title = "(" + unread + ") Σigma - Chat to random strangers";
	    		}
	    		requestStats();
	    		break;
	    	case "id":
	    		client.self.id = data.id;
	    		client.self.hash = data.hash;
	    		("Assigned ID of " + client.self.id + " with hash of " + data.hash);
	    		$("#status").html("<strong>Connected to the chat server, just waiting for a partner. Hold tight!</strong>");
	    		requestClient();
	    		requestStats();
	    		break;
	    	case "partner":
	    		client.partner.id = data.id;
	    		client.partner.hash = data.hash;
	    		client.partner.automessage = data.automessage;
	    		console.log(data);
	    		("Assigned partner with an ID of " + client.partner + " with hash of " + data.hash);
	    		$("#chat").html('<li class="list-group-item" id="status"></li>');
	    		$("#status").html("<strong>Awesome! You're connected with a random stranger, say hello or <a data-toggle=\"modal\" href=\"ajax/partner.html\" data-target=\"#modal\">view your partners automessage</a>.");
	    		setDisabled(false);
	    		break;
	    	case "status":
	    		$("#chat").html('<li class="list-group-item" id="status"></li>');
	    		$("#status").html("<strong>" + data.message + "</strong>");
	    		break;
	    	case "disconnected":
	    		var time = new Date(),
	    			hours = pad(time.getHours()),
	    			minutes = pad(time.getMinutes());
	    		$('#chat').append('<li class="list-group-item"><span class="label label-primary pull-right">' + hours + ':' + minutes + '</span><b>System:</b> ' + data.message + '</li>');
	    		setDisabled(true);
	    		setTimeout(requestClient, 3000);
	    		break;
	    	case "stats":
	    		$("#stats").text(data.user_count + " users, " + data.message_count + " messages");
	    		break;
	    	case "typing":
	    		$('#typing').fadeIn('fast');
	    		setTimeout(function(){
	    			$('#typing').fadeOut('fast');
	    		}, 3000);
	    		break;
		}
	});

	/* ========== UI STUFF ========== */
	$("#message").focus(function(){
		if(client.self.settings.hide_buttons){
			$('#disconnect, #send_picture').hide();
			$('#message').parent().addClass("col-md-12").removeClass("col-md-8");
		}
	});
	$("#message").blur(function(){
		if(client.self.settings.hide_buttons){
			$('#message').parent().addClass("col-md-8").removeClass("col-md-12");
			$('#disconnect, #send_picture').show();
		}
	});

	var timeoutId,
		intervalId;

	function stopMyInterval() {
	    clearInterval(intervalId);
	    intervalId = null;
	}

	$("#message").keypress(function(event){
	    clearTimeout(timeoutId);
	    if(event.keyCode == 13 && $("#message").val() != ""){
	    	sendMessage($('#message').val());
			$('#message').val('');
		}
	    if (!intervalId) {
	        intervalId = setInterval(function() {
	            ws.send(JSON.stringify({"type": "typing", "from": {"id": client.self.id, "hash": client.self.hash}, "to": {"id": client.partner.id, "hash": client.partner.hash}}));
	        }, 3000);
	    }

	    timeoutId = setTimeout(stopMyInterval, 500);
	}).blur(stopMyInterval);

	$("#send_picture").click(function(result){
		bootbox.prompt("Enter picture URL...", function(result){
			if(result){
				("sending picture: " + result);
				ws.send(JSON.stringify({"type": "picture", "url": escape(result), "from": {"id": client.self.id, "hash": client.self.hash}, "to": {"id": client.partner.id, "hash": client.partner.hash}}));
			}
		});
	});
	$("#disconnect").click(function(){
		disconnect();
	});
	$(document).keydown(function (e) {
	    if(e.which === 27 && (e.ctrlKey || e.metaKey)){ // Ctrl + ESC
	        disconnect();
	    }
	});

	/* ========== FUNCTIONS ========== */
	function escape(message){
		return $("<div/>").text(message).html();
	}
	function pad(n) {
	    return (n < 10) ? ("0" + n) : n;
	}
	function sendMessage(message) {
		ws.send(JSON.stringify({"type": "message", "message": escape(message), "from": {"id": client.self.id, "hash": client.self.hash}, "to": {"id": client.partner.id, "hash": client.partner.hash}}));
	}
	function requestClient(){
		ws.send(JSON.stringify({"type": "requestpartner", "from": {"id": client.self.id, "hash": client.self.hash, "automessage": client.self.automessage}}));
	}
	function disconnect(){
		ws.send(JSON.stringify({"type": "disconnect", "from": {"id": client.self.id, "hash": client.self.hash}, "to": {"id": client.partner.id, "hash": client.partner.hash}}));
	}
	function requestStats(){
    	ws.send(JSON.stringify({"type": "stats", "from": {"id": client.self.id, "hash": client.self.hash}}));
    }
	function setDisabled(action){
		$("#message, #disconnect, #send_picture").prop('disabled', action);
	}
	function replaceURLWithHTMLLinks(text) {
	    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
	    var exp2 = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])+\.(?:jpe?g|gif|png)/ig;
	    var links = text.replace(exp,"<a href='$1' target='_blank'>$1</a>");
	    var images = links.replace(exp2, "<img src='$1' alt='$1'>");
	    return links;
	}
	function onBlur() {
		focused = false;
	};
	function onFocus() {
		focused = true;
		unread = 0;
		document.title = "Σigma - Chat to random strangers";
	};

	if (/*@cc_on!@*/false) {
		document.onfocusin = onFocus;
		document.onfocusout = onBlur;
	} else {
		window.onfocus = onFocus;
		window.onblur = onBlur;
	}
}
