var cyborgconfig = require('../../lib/config.js');

    var signalconfig = {
      "isDev": true,
      "server": {
        "port": 8888,
        "/* secure */": "/* whether this connects via https */",
        "secure": true,
        "key": key_path,
        "cert": cert_path,
        "password": null
      },
      "rooms": {
        "/* maxClients */": "/* maximum number of clients per room. 0 = no limit */",
        "maxClients": 0
      },
      "stunservers": [
        /*{
          "urls": "stun:stun.l.google.com:19302"
        }*/
      ],
      "turnservers": [
        /*{
          "urls": ["turn:your.turn.servers.here"],
          "secret": "turnserversharedsecret",
          "expiry": 86400
        }*/
      ]
    }
/*global console*/

console.log(signalconfig)

var 
    fs = require('fs'),
    sockets = require('./sockets'),
    port = 8888,
    server_handler = function (req, res) {
        res.writeHead(404);
        res.end();
    },
    server = null;

// Create an http(s) server instance to that socket.io can listen to

    server = require('https').Server({
        key: fs.readFileSync(signalconfig.server.key),
        cert: fs.readFileSync(signalconfig.server.cert),
        passphrase: ''
    }, server_handler);

server.listen(port);

sockets(server, signalconfig);

if (signalconfig.uid) process.setuid(signalconfig.uid);

var httpUrl;
if (signalconfig.server.secure) {
    httpUrl = "https://localhost:" + port;
} else {
    httpUrl = "http://localhost:" + port;
}
console.log(' -- signal master is running at: ' + httpUrl);
