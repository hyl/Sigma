Sigma
=====

Private web chat using Node.js and WebSocket.

Description
============
**Sigma** is an open source web chat, running on Node.js. It features private and anonymous chat, with a waiting list for partners. It is still under development, and has not been finished. So far, only connections and chat work. In the near future, it will be possible to disconnect and send pictures.

Requirements
============
  * Node.js
  * WebSocket-enabled browser
  
Installation
============
<<<<<<< HEAD
Stick `server/server.js` on your server. Now run `sudo node server.js`. Put `client/index.html` somewhere and make sure that the path in `client/js/app.js` matches that of your install location.
=======
Stick `server/server.js` on your server. Open it in your favourite editor (`nano`!) and edit line 28 to include your salt variable. It should be at least 8 characters long, and a mix of upper/lowercase letters and numbers (eg "w0aff4lasNR685q"). Now run `sudo node server.js`. Put `client/index.html` somewhere and make sure that the path in `client/js/app.js` matches that of your install location.
>>>>>>> 187eddedadaf50e1f0a39b86e135356758b2d4a0
