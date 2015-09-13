Meteor.startup(function () {

  Connections.remove({})
  
  if (Players.find().count() == 0) {

    _.each(default_players, function (player) {
      Players.insert(_.extend(player, {
        state : "stop",
        filename : "",
        volume: 1.0
      }));
    });
  }

  if (Globals.find({"name":"show_labels"}).count() == 0) {
    Globals.insert({"name":"show_labels", "value":true})
  }


});

Meteor.publish('media', function() {
  var self = this;
  if (process.env.PWD) var prefix = process.env.PWD
  else var prefix = "/users/orpheus/media/"
  var path = prefix + '/public/media/';
  var medias = fs.readdirSync(path);
  _.each(medias, function(media) {
    if(media.substr(0,1) != ".") {
      self.added('media', media, { 
        'url': '/media/' + media,
        'name': media
      });
    }
  });
  this.ready();
});


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