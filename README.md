Sigma
=====

Private web chat using Node.js and WebSocket.

Description
============
**Sigma** is an open source web chat, running on Node.js. It features private and anonymous chat, with a waiting list for partners. It is still under development, and has not been finished. So far, I have implemented connection, chat, picture messaging, disconnect &amp; partner allocation, and typing messages [BETA].

For more information please see the website at http://ovalbit.github.io/Sigma/

Requirements
============
  * Node.js
    * http
    * crypto
    * cli-color
    * websocket
  * WebSocket-enabled browser
  
Installation
============
1. Stick `server/server.js` on your server.
2. Install Crypto with `sudo npm install crypto`
3. Install cli-color with `sudo npm install cli-color`
4. Install Express.js with `sudo npm install express`
5. Install WebSocket with `sudo npm install websocket`
6. Now run `sudo node server.js`.
7. Put `client/index.html` somewhere and make sure that the path in `client/js/app.js` matches that of your install location.
8. Open `index.html` in your browser and give it a go with a friend.
