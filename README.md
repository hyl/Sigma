Sigma
=====

Private web chat using Node.js and WebSocket.

Description
============
**Sigma** is an open source web chat, running on Node.js. It features private and anonymous chat, with a waiting list for partners. It is still under development, and has not been finished. So far, only connections and chat work. In the near future, it will be possible to disconnect and send pictures.

For more information please see the website at http://ovalbit.github.io/Sigma/

Requirements
============
  * Node.js
    * Crypto
  * WebSocket-enabled browser
  
Installation
============
1. Stick `server/server.js` on your server.
2. Install Crypto with `sudo npm install crypto`
3. Now run `sudo node server.js`.
4. Put `client/index.html` somewhere and make sure that the path in `client/js/app.js` matches that of your install location.
5. Open `index.html` in your browser and give it a go with a friend.
