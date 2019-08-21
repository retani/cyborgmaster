import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

var express = require('express');

const app = express();

var port = 8080

// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });

app.use("/media", express.static(local_media_path));

WebApp.connectHandlers.use(app);
