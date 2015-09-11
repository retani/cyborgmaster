
Meteor.subscribe('media');

Meteor.subscribe('players');

// counter starts at 0
Session.setDefault('counter', 0);

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
    return Players.find()
  }
});

Template.playerslist.helpers({
  players: function () {
    return Players.find()
  }
});

Template.master.helpers({
  players: function () {
    return Players.find()
  },
  'media': function () {
    var files = Media.find({})
    return files;
  }  
});

Template.player.helpers({
  'playerId': function () {
    return playerId
  }
});

Template.player.onRendered( function() {
  console.log("rendered player " + FlowRouter.getParam("id"))
  var playerType = Players.findOne({"_id":playerId}).type
  Players.find({ "_id" : FlowRouter.getParam("id") }).observeChanges({
    changed: function(id, doc) {
      if (FlowRouter.getRouteName() == "player")
      var videoElem = $("video").get(0)
      console.log(doc);
      if (doc.filename) {
        if (playerType == "screen")
          videoElem.src = "/media/" + doc.filename
        else {
          videoElem.src = "http://localhost/" + doc.filename
        }
      }
      if (doc.state) {
        if (doc.state == "play") {
          videoElem.play()
        }
        else {
          videoElem.pause()
        }
      }
    }
  });       
});

Template.tableCell.helpers({
  'isSelected': function () {
    var mediaElem = Template.parentData()
    
  },
  'mediaState': function () {
    var mediaElem = Template.parentData()
    if (this.filename == mediaElem.name) return this.state
    else return "-"
  }
});

Template.tableCell.events({
  'click .state': function () {
    var mediaElem = Template.parentData()
    var state = this.state
    var newstate
    if (state == "stop") newstate = "play"
    else newstate = "stop"
    Players.update({'_id':this._id},{$set :{'filename':mediaElem.name, 'state':newstate}})
  }
});



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
