function notify(title, body, icon) {
	if(window.localStorage.getItem("native_notification") == false){
		return;
	}
	// Let"s check if the browser supports notifications
	if (!("Notification" in window)) {
		window.localStorage.setItem("native_notification", false);
		alert("This browser does not support desktop notification, so they have been disabled.");
	}

	// Let"s check if the user is okay to get some notification
	else if (Notification.permission === "granted") {
	// If it"s okay let"s create a notification
	var notification = new Notification(
		title,
		{
			body: body,
			icon: icon,
			tag: new Date().getTime()
		}
	);
	}

	// Otherwise, we need to ask the user for permission
	// Note, Chrome does not implement the permission static property
	// So we have to check for NOT "denied" instead of "default"
	else if (Notification.permission !== "denied") {
	Notification.requestPermission(function (permission) {

	  // Whatever the user answers, we make sure Chrome stores the information
	  if(!("permission" in Notification)) {
		Notification.permission = permission;
	  }

	  // If the user is okay, let's create a notification
	  if (permission === "granted") {
		var notification = new Notification(
			title,
			{
				body: body,
				icon: icon,
				tag: new Date().getTime()
			}
		);
	  }
	});
	}
}