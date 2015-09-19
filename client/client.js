Session.setDefault('setup', false);

Template.medialist.helpers({
  'media': function () {
    var files = Media.find({})
    console.log(files.fetch())
    return files;
  }
});

Template.userslist.helpers({
  'users': function () {
    console.log(Connections.find().fetch())
    console.log(Meteor.users.find().fetch())
    return Connections.find()
  }
});

Template.home.helpers({
  players: function () {
    return Players.find({'type':'screen'})
  }
});

Template.playerslist.helpers({
  players: function () {
    return Players.find()
  }
});

Template.master.helpers({
  players: function () {
    return Players.find({}, { sort:{"_id":1} })
  },
  'media': function () {
    var files = Media.find({},{ sort:{"name":1} })
    return files;
  },
  'setup':function(){
    return Session.get("setup");
  },
  'labelschecked': function(){
    return {"checked":(Players.find({"show_labels":true}).count() > 0 ? "checked" : null)}
  },
  'setupchecked': function(){
    return { "checked": (Session.get('setup') ? "checked" : null)}
  },  
  'muted':function(){
    return this.volume == 0
  },
  'areSelectedPlayersStopped':function(){
    return Players.find({ 'preselect': { $type: 2 }, 'state':'stop'}).count() > 0
  },
  'isSelected': function () {
    var mediaElem = Template.parentData()
    return (this.filename == mediaElem.name)
  },
  'isPreselected': function () {
    var mediaElem = Template.parentData()
    return (this.preselect != null && this.preselect == mediaElem.name)
  },
  'isPlayerType' : function(type){
    return this.type == type
  }
}); 

Template.master.events({
  'click #show_labels': function (event) {
    console.log("checked labes")
    var checked = event.target.checked
    Meteor.call('labels', checked, function (error, result) {});
  },
  'click #show_setup': function(event){
    Session.set('setup', event.target.checked);
  },
  'click .mute':function(event){
    Players.update({'_id':this._id}, {$set : {"volume":0}});
  },
  'click .unmute':function(event){
    Players.update({'_id':this._id}, {$set : {"volume":1}});
  },
  'change .volume':function(event){
    Players.update({'_id':this._id}, {$set : {"volume":event.target.value}});
  },  
  'click .prepare_select':function(event){
    Players.find({ 'preselect': { $type: 2 }}).forEach(function (doc) {
      Players.update({'_id':doc._id}, { $set : { 'filename':doc.preselect , 'state':'stop'  } })
    });
  },
  'click .prepare_clear':function(event){
    Meteor.call('updatePreselected', { 'preselect':null });
  },
  'click .general_controls .play':function(event){
    console.log("play multi")
    Meteor.call('updatePreselected', {'state':'play'})
  },
  'click .general_controls .stop':function(event){
    Meteor.call('updatePreselected', {'state':'stop'})
  },
  'click .general_controls .pause':function(event){
    Meteor.call('updatePreselected', {'state':'pause'})
  },
}); 

Template.setupCell.helpers({
  'checked': function () {
    var mediaElem = Template.parentData()
    var hasEntry = Mediaavail.find({'mediaId':mediaElem.name, 'playerId':this._id}).count() > 0
    return { 'checked' : ( hasEntry  ? "checked" : null ) }
  },
  'raspberry':function() {
    return this.type=="rpi"
  }  
});

Template.setupCell.events({
  'click .available': function (event) {
    var mediaElem = Template.parentData()
    if (event.target.checked) {
      Meteor.call('addMediaavail', { 'mediaId':mediaElem.name, 'playerId':this._id });
    }
    else {
      Meteor.call('removeMediaavail', { 'mediaId':mediaElem.name, 'playerId':this._id });
    }    
  }
});

Template.tableCell.helpers({
  'isSelected': function () {
    var mediaElem = Template.parentData()
    return (this.filename == mediaElem.name)
  },
  'selected': function () {
    var mediaElem = Template.parentData()
    return (this.filename == mediaElem.name ? {"checked":"checked"} : {"checked":null})
  },  
  'preselected': function () {
    var mediaElem = Template.parentData()
    return (Players.find({ '_id':this._id, 'preselect' : mediaElem.name }).count() > 0 ? {"checked":"checked"} : {"checked":null})
  },    
  'isMediaState':function(state) {
    return this.state == state
  },
  'checked':function(){
    var mediaElem = Template.parentData()
    return Players.findOne({'_id':this._id}).filename == mediaElem.name
  }
});

Template.tableCell.events({
  'change .select': function (event) {
    var mediaElem = Template.parentData()
    var selectedVideo = mediaElem.name
    Players.update({'_id':this._id},{$set :{'filename':mediaElem.name,'state':'stop'}})
    /*
    var state = this.state
    var newstate
    if (state == "stop") newstate = "play"
    else newstate = "stop"
    Players.update({'_id':this._id},{$set :{'filename':mediaElem.name, 'state':newstate}})*/
  },
  'click .play' : function(event){
    var mediaElem = Template.parentData()
    console.log("play " + mediaElem.name)
    if (this.filename != mediaElem.name) {
      Players.update({'_id':this._id},{$set :{'state':'stop'}})
    }
    Players.update({'_id':this._id},{$set :{'filename':mediaElem.name,'state':'play'}})
  },
  'click .pause' : function(event){
    var mediaElem = Template.parentData()
    Players.update({'_id':this._id},{$set :{'filename':mediaElem.name,'state':'pause'}})
  },
  'click .stop' : function(event){
    var mediaElem = Template.parentData()
    Players.update({'_id':this._id},{$set :{'filename':mediaElem.name,'state':'stop'}})
  },
  'click .preselect' : function(event){
    var mediaElem = Template.parentData()
    if (event.target.checked){
      $('[data-player="' + this._id + '"]:not([data-media="' + mediaElem.name + '"]) .preselect').prop('checked', false)
      console.log("[data-player=" + this._id + "]:not([data-media=\"" + mediaElem.name + "\"]) .select")
    }
    Players.update({'_id':this._id},{$set :{'preselect':((event.target.checked) ? mediaElem.name: null)}})
  }  
});

Template.player.helpers({
  'playerId': function () {
    return playerId
  },
  'player': function () {
    return Players.findOne({"_id":playerId})
  },
  'info': function () {
    return Players.findOne({"_id":playerId}).info
  },
  'show_info': function() {
    return Players.findOne({"_id":playerId}).show_labels
  }
});

Template.player.onCreated(function(){
})

Template.player.onRendered( function() {
  this.subscribe('players', function(){
    console.log("rendered player " + playerId)
    $("body").css("overflow","hidden")
    console.log(Players.find().fetch())
    var playerType = Players.findOne({"_id":playerId}).type
    var videoElem = $("video").get(0)
    observer = Players.find({ "_id" : playerId }).observeChanges({
      changed: function(id, doc) {
        if (doc.pingtime) {
          console.log("pingback",playerId)
          Meteor.call('playerPingback', playerId, function (error, result) {});
        }
        if (FlowRouter.getRouteName() == "player")
        console.log(doc);
        if (doc.filename) {
          if (playerType == "screen")
            videoElem.src = "http://" + mediaserver_address + "/" + mediaserver_path + doc.filename
          else {
            videoElem.src = "http://localhost/" + doc.filename
          }
        }
        if (doc.state) {
          if (doc.state == "play") {
            videoElem.play()
          }
          else if (doc.state == "pause") {
            videoElem.pause()
          }
          else if (doc.state == "stop") {
            videoElem.pause()
            videoElem.currentTime = 0
          }
        }
        if (typeof doc.volume != "undefined") {
          videoElem.volume = doc.volume
          console.log(doc.volume)
        }
      }
    });
    videoElem.onended = function() {
      Players.update({"_id":playerId}, { $set : {"state":"stop"}})
    };
    Players.update({"_id":playerId}, { $set : { "state":"stop", "filename":null } } ) // reset
  })
});

Template.player.onDestroyed(function(){
  observer.stop()
})

Connections.find({}).observe({
  'added':function() {
    console.log("NEW")

    if (FlowRouter.getRouteName() == "home"){
      var user = Meteor.user();
      var currentConnection = Connections.findOne({'userId':user._id})

      var ipIdentifiedPlayer = Players.findOne({ ips: { $elemMatch: { $in: [currentConnection.ipAddr] } } })
      console.log(ipIdentifiedPlayer)
      if (ipIdentifiedPlayer._id) {
        console.log("redirect " + currentConnection.ipAddr + " -> player " + ipIdentifiedPlayer._id)
        FlowRouter.go("player", {id:ipIdentifiedPlayer._id})
      }
    }
  }
})
