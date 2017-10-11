//import sockets from 'signal-master/sockets'
//import express from 'express';


//if (Players.find({stream:true}).count() > 0) {
	//var config = require('../lib/config.js')
	require('../lib/config.js')

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

	console.log("starting signalmaster")


	console.log(signalconfig)

	var express = require('express')
	var sockets = require('signal-master/sockets')

	var app = express()
	var server = app.listen(8888/*, mediaserver_address*/)
	sockets(server, signalconfig) // config is the same that server.js uses*/
//}

