Meteor.startup(function () {

  if (enable_media_server) {
    require('../imports/mediaserver.js')
  }


  Connections.remove({})

/*
  if (Players.find().count() == 0) {

    _.each(default_players, function (player) {
      Players.insert(_.extend(player, {
        state : "stop",
        filename : "",
        volume: 1.0
      }));
    });
  }
  else {
    _.each(default_players, function(player){
      Players.update({'_id':player._id}, {$set:{info:player.info}});
    })
  }
*/

  Players.remove({})
    _.each(default_players, function (player) {
    Players.insert(_.extend(player, {
      state : "stop",
      filename : "",
      volume: 1.0
    }));
  });


  Globals.remove({})
  Globals.insert({"name": "show_labels", "value" :true})
  Globals.insert({"name": "mediaserver_address", "value": mediaserver_address})
  Globals.insert({"name": "mediaserver_path", "value": mediaserver_path})
  Globals.insert({"name": "local_media_path", "value": local_media_path})

  var play_delay_default = false;
  if (Globals.find({'name':'play_delay'}).count() == 0) {
    //Globals.insert({"name":"play_delay", "value":play_delay_default})
    Meteor.call('playDelay', play_delay_default, function (error, result) {});
  }
  

  Players.update({},{ $set : { 'mediaserver_address':mediaserver_address, 'mediaserver_path':mediaserver_path } }, {multi:true})  

  Meteor.publish('players', function(options){
    var query = {}
    var fields = {}
    if (options) {
      if (options.noPing) {
        fields.pingtime = 0
        fields.pingback = 0
      }
      if (options.noPingback) {
        fields.pingback = 0
      }
      if (options.playerId) {
        query._id = options.playerId
      }
    }
    return Players.find(query, { fields: fields } )
  })

  Meteor.publish('playersMeta', function(){
    var query = {}
    var fields = { _id: 1, info: 1, type: 1 }
    var sort = { info: 1 }
    return Players.find(query, { fields, sort } )
  })
  
  Meteor.publish('globals', function(options){
    return Globals.find()
  })

  //var nodeDir = Meteor.npmRequire("node-dir")

});

var publishedMedia = Meteor.publish('media', function() {
  var self = this;  
  const mediaPublicationFiles = {}
  Meteor.setInterval(function(){
    addFiles(self, mediaPublicationFiles)
  },5000)
  addFiles(self, mediaPublicationFiles)

  // add streams
  var streamPlayers = Players.find({stream: true}).fetch();
  _.each(streamPlayers, function(player){
    console.log("adding stream")
    self.added('media', player._id, { 
      'url': null,
      'name': 'stream:'+player._id,
      'filesize': 0,
      'target' : "video",
      'stream' : true,
      'streaming': true,
      'streamname' : player.info,
      'player_id': player._id
    });    
  })
  this.ready();
});


function addFiles(publication, mediaPublicationFiles) { // TODO: do not add the same files all the time. Note: Subscription contents need to be added and removed for each subscription somehow separately

  var path = local_media_path;
  var medias = fs.readdirSync(path)
    .filter(media => media.substr(0,1) != ".")
    .map(media => ({ 
      name: media,
      filesize: fs.statSync(path + "/" + media)['size']
    }))
  // add files
  _.each(medias, function(mediaObj) {
    var media = mediaObj.name
    var filesize = mediaObj.filesize

    if (mediaPublicationFiles[media] && mediaPublicationFiles[media].filesize === filesize) {
      return
    }

    var target = "video"
    var ext = media.split('.').pop().toLowerCase()
    if (ext == "url") {
      var url = fs.readFileSync(path + '/' + media, 'utf8');
      target = "iframe"
    }
    else if (media.split('.').pop() == "imgurl") {
      var url = fs.readFileSync(path + '/' + media, 'utf8');
      target = "img"
    }
    else if (['jpg','gif','png'].indexOf(ext) > -1) {
      var url = "http://" + mediaserver_address + "/" + mediaserver_path + media
      target = "img"
    }
    else {
      var url = '/media/' + media
    }

    var doc = { 
      'url': url,
      'name': media,
      'filesize': filesize,
      'target' : target
    }

    console.log("adding", media, doc)

    publication.added('media', media, doc);
    mediaPublicationFiles[media] = doc // keep track of published files
  });

  // remove files
  let keysToRemove = []

  Object.keys(mediaPublicationFiles).forEach( name => { // media = key = filename
    let existingMedia = medias.find( mediaObj => mediaObj.name === name )
    if (!existingMedia) {
      keysToRemove.push(name)
    }
  })

  keysToRemove.forEach( key => {
    console.log("removing", key)

    publication.removed('media', key);
    delete mediaPublicationFiles[key];
  })

  publication.ready();
}


if (Players.find({stream:true}).count() > 0) {
  console.log("SSL connections required because of stream enabled players");
  SSL(key_path, cert_path, 8443);
  console.log("starting signalmaster")
  require("../imports/signalmaster/server.js");
}

Meteor.publish("connections", function() {
  this.ready()
  //return UserStatus.connections.find()
});

UserStatus.events.on("connectionLogin", function(fields) { 
  console.log("LOGIN")
  console.log(fields)
  Connections.insert(fields)
})

UserStatus.events.on("connectionLogout", function(fields) { 
  console.log("LOGOUT")
  console.log(fields)
  Connections.remove({"connectionId" : fields.connectionId})
})

pingPlayers = function(){
  Players.update({'pingback':0 }, {$set:{'connected':false}}, {multi:true});
  Players.update({'pingback':{$gt:0} }, {$set:{'connected':true}}, {multi:true});  
  Meteor.call('playersPing', null, function (error, result) {});
}
Meteor.setInterval(pingPlayers,5000)

Players.find({ 'paired' : { $type: 2 }}).observeChanges({ // check for paired players
  changed: function (id, fields) {
    if (fields.state ==  "play" && fields.filename) { // stop first
      var masterPlayer = Players.findOne({_id: id})
      Players.update({ _id : masterPlayer.paired }, { $set : { state: 'stop' } })
    }
    if (fields.filename) {
      var masterPlayer = Players.findOne({_id: id})
      Players.update({ _id : masterPlayer.paired }, { $set : { filename: masterPlayer.filename } })
    }
    if (fields.state) {
      var masterPlayer = Players.findOne({_id: id})
      var pairedPlayer = Players.findOne({ _id : masterPlayer.paired })
      if (pairedPlayer.filename != masterPlayer.filename) {
        Players.update({ _id : masterPlayer.paired }, { $set : { filename: masterPlayer.filename } })   
      }
      Players.update({ _id : masterPlayer.paired }, { $set : { state: masterPlayer.state } })
    }    
  },
});

/*
Players.find({ "type" : "rpi" }).observe({
  changed: function(olddoc,newdoc) {

    if (olddoc.state != newdoc.state) {
      var url_prefix = 'http://' + newdoc.ip + "/omx/"
      if (newdoc.state == "play") {
        var url_suffix = 'play/" + "/home/pi/cyborg/media/" + newdoc.filename'
      }
      else if (newdoc.state == "stop") {
        var url_suffix = 'stop/'
      }
      else if (newdoc.state == "stop") {
        var url_suffix = 'pause/'
      }      
      var url = url_prefix + url_suffix
      console.log(url)
      Meteor.http.call("GET", url);
    }
  }
});     
*/


/*
var express = require('express')
var sockets = require('signalmaster/sockets')

var app = express()
var server = app.listen(port)
sockets(server, config) // config is the same that server.js uses
*/

Players.find().observe({ // check for paired players
  added: function (fields) {
    Players.update({ _id : fields._id }, { $set : { playStart: false, playOffset: 0 } }) // reset
  },
  changed: function (fields, oldFields) {
    if (fields.filename != oldFields.filename) {
      Players.update({ _id : fields._id }, { $set : { playStart: false, playOffset: 0 } }) // reset
    }
    if (fields.state == "stop") {
      //console.log("stop", fields.filename)
      Players.update({ _id : fields._id }, { $set : { playStart: false, playOffset: 0 } }) // reset
    }    
    if (fields.state ==  "play" && oldFields.state != "play") { 
      //console.log("play", fields.filename)
      Players.update({ _id : fields._id }, { $set : { playStart: Date.now() } }) // update playStart
    }    /*
    if (fields.state ==  "play" && oldFields.state != "play" && oldFields.state != "plause") { 
      console.log("play - not from pause", fields.filename)
      Players.update({ _id : fields._id }, { $set : { playStart: Date.now(), playOffset: 0 } }) // update playStart
    }        */
    if (fields.state ==  "pause" && oldFields.state != "pause") { 
      //console.log("pause", fields.filename)
      var dt = fields.playStart ? Date.now() - fields.playStart + oldFields.playOffset : oldField.playOffset
      Players.update({ _id : fields._id }, { $set : { playStart: false, playOffset: dt } }) // update playStart
    }    
  },
});