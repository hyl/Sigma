$("#active").hide();
$("#start_chat").click(function(){
	$("#inactive").fadeOut(function(){
		$("#active").fadeIn();
			connect();
	});
});
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
	var client = {"self": {"id": null, "hash": null}, "partner": {"id": null, "hash": null}};
	ws.addEventListener("message", function(e) {
		console.log(e);
		var data = JSON.parse(e.data);
		switch(data.type){
			case "message":
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
	    		$('#chat').append('<li class="list-group-item"><span class="label label-primary pull-right">' + hours + ':' + minutes + '</span><b>' + from + ':</b> ' + data.message + '</li>');
	    		if(!focused){
	    			unread++;
					document.title = "(" + unread + ") Σigma - Chat to random strangers";
	    		}
	    		requestStats();
	    		break;
	    	case "picture":
	    		var time = new Date(),
	    			hours = pad(time.getHours()),
	    			minutes = pad(time.getMinutes());
	    		$('#chat').append('<li class="list-group-item"><span class="label label-primary pull-right">' + hours + ':' + minutes + '</span><b>' + from + ':</b> <img src="' + data.url + '" alt="What is the meaning of life?"></li>');
	    		break;
	    	case "id":
	    		client.self.id = data.id;
	    		client.self.hash = data.hash;
	    		console.log("Assigned ID of " + client.self.id + " with hash of " + data.hash);
	    		$("#status").html("<strong>Connected to the chat server, just waiting for a partner. Hold tight!</strong>");
	    		requestClient();
	    		requestStats();
	    		break;
	    	case "partner":
	    		client.partner.id = data.id;
	    		client.partner.hash = data.hash;
	    		console.log("Assigned partner with an ID of " + client.partner + " with hash of " + data.hash);
	    		$("#chat").html('<li class="list-group-item" id="status"></li>');
	    		$("#status").html("<strong>Awesome! You're connected with a random stranger, say hello!");
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
	    		requestClient();
	    		break;
	    	case "stats":
	    		$('#clients').text(data.user_count);
	    		$('#messages').text(data.message_count);
	    		break;
		}
	});

	/* ========== UI STUFF ========== */
	$("#message").focus(function(){
		$('#disconnect, #send_picture').hide();
		$('#message').parent().addClass("col-md-12").removeClass("col-md-8");
	});
	$("#message").blur(function(){
		$(this).parent().addClass("col-md-8").removeClass("col-md-12");
		$('#disconnect, #send_picture').show();
	});
	$("#message").keypress(function(event){
		if(event.keyCode == 13){
			sendMessage($('#message').val());
			$('#message').val('');
		}
	});
	$("#send_picture").click(function(result){
		bootbox.prompt("Enter picture URL", sendPicture(result));
	});
	$("#disconnect").click(function(){
		console.log("Disconnecting from partner...");
		disconnect();
	});
	$(document).keydown(function (e) {
	    if(e.which === 27 && (e.ctrlKey || e.metaKey)){ // Ctrl + ESC
	        disconnect();
	    }
	});

	/* ========== FUNCTIONS ========== */
	function escapeMessage(message){
		return $("<div/>").text(message).html();
	}
	function pad(n) {
	    return (n < 10) ? ("0" + n) : n;
	}
	function sendMessage(message) {
		ws.send(JSON.stringify({"type": "message", "message": escapeMessage(message), "from": {"id": client.self.id, "hash": client.self.hash}, "to": {"id": client.partner.id, "hash": client.partner.hash}}));
	}
	function sendPicture(url) {
		if(url){
			ws.send(JSON.stringify({"type": "picture", "url": escapeMessage(url), "from": {"id": client.self.id, "hash": client.self.hash}, "to": {"id": client.partner.id, "hash": client.partner.hash}}));
		}
	}
	function requestClient(){
		ws.send(JSON.stringify({"type": "requestpartner", "from": {"id": client.self.id, "hash": client.self.hash}}));
		console.log("Requested partner...");
	}
	function disconnect(){
		ws.send(JSON.stringify({"type": "disconnect", "from": {"id": client.self.id, "hash": client.self.hash}, "partner": {"id": client.partner.id, "hash": client.partner.hash}}));
		console.log("Disconnected from partner...");
	}
	function requestStats(){
    	ws.send(JSON.stringify({"type": "stats", "from": {"id": client.self.id, "hash": client.self.hash}}));
    }
	function setDisabled(action){
		$("#message, #disconnect, #send_picture").prop('disabled', action);
	}
	function onBlur() {
		focused = false;
	};
	function onFocus(){
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