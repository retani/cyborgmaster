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
    return Players.find({}, { sort:{"info":1} })
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
  'linechecked': function(){
    var allchecked = true;
    var media = this.name;
    var players = Players.find({}, { sort:{"_id":1} })
    players.forEach(function (player) {
      if (player.preselect != media) {
        allchecked = false;
      }
    });
    return {"checked": (allchecked ? "checked" : null)}
  },      
  'playdelaychecked': function(){
    var play_delay = Globals.findOne({'name':'play_delay'})
    return { "checked": (typeof(play_delay) != "undefined" && play_delay.value==true ? "checked" : null)}
  },      
  'muted':function(){
    return this.volume == 0
  },
  'streamsExist':function(){
    return Players.find({stream:true}).count() > 0
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
  },
  'groupControlAmount' : function() {
    return Players.find({ 'preselect' : { $ne: null } }).count()
  },
  'mediaUnavailable' : function() {
    var mediaId = Template.parentData()._id
    var mediaKey = filename2key(mediaId)
    if (this.type != 'rpi' || !this.mediaStatus) return false
    //console.log(this.mediaStatus, mediaKey, this.mediaStatus[mediaKey])
    if (!this.mediaStatus[mediaKey] || !this.mediaStatus[mediaKey].available) return true
  },
  'pairedPlayer' : function() {
    return ( this.paired ? Players.findOne({ _id: this.paired }) : null )
  },
  'url': function(){
    var mediaserver_address = getGlobalValue("mediaserver_address")
    var mediaserver_path = getGlobalValue("mediaserver_path")
    return "http://" + mediaserver_address + "/" + mediaserver_path + this.name
  },
  'humansize': function(){
    return Math.floor(this.filesize/(1024*1024)) + "M"
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
  'click #play_delay': function(event){
    var checked = event.target.checked
    Meteor.call('playDelay', checked, function (error, result) {});
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
  'click .stream_player_controls .play':function(event){
    console.log("play stream", this);
    Players.update({'_id':this._id}, {$set : {"streaming":true}});
  },
  'click .stream_player_controls .stop':function(event){
    console.log("stop stream", this);
    Players.update({'_id':this._id}, {$set : {"streaming":false}});
  },  
  'click .stream_player_controls .record':function(event){
    console.log("start recording stream", this);
    Players.update({'_id':this._id}, {$set : {"isRecording":true}});
  },  
  'click .stream_player_controls .stop_recording':function(event){
    console.log("stop recording stream", this);
    Players.update({'_id':this._id}, {$set : {"isRecording":false}});
  },      
  'click .prepare_select':function(event){
    Players.find({ 'preselect': { $type: 2 }}).forEach(function (doc) {
      Players.update({'_id':doc._id}, { $set : { 'filename':doc.preselect , 'state':'stop'  } })
    });
  },
  'click .prepare_clear':function(event){
    Meteor.call('updatePreselected', { 'preselect':null });
  },
  'change .check_line':function(event){
    var allchecked = true;
    var media = this.name;
    var players = Players.find({}, { sort:{"_id":1} })
    players.forEach(function (player) {
      if (player.preselect != media) {
        allchecked = false;
      }
    });
    players.forEach(function (doc) {
      Players.update({'_id':doc._id}, { $set : { 'preselect': ( allchecked ? null : media ) } })
    });
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
  'click .reload_videos': function(event) {
    $("body").css("opacity","0.1")
    Meteor.call('reloadVideos')
  }
}); 

Template.master.onCreated(function(){
  this.subscribe('globals');
})

Template.setupCell.helpers({
  'checked': function () {
    var mediaElem = Template.parentData()
    var hasEntry = Mediaavail.find({'mediaId':mediaElem.name, 'playerId':this._id}).count() > 0
    return { 'checked' : ( hasEntry  ? "checked" : null ) }
  },
  'raspberry':function() {
    return this.type=="rpi"
  },
  'mediaUnavailable' : function() {
    var mediaId = Template.parentData()._id
    var mediaKey = filename2key(mediaId)
    if (this.type != 'rpi' || !this.mediaStatus) return false
    //console.log(mediaKey, this.mediaStatus[mediaKey])
    if (!this.mediaStatus[mediaKey] || !this.mediaStatus[mediaKey].available) return true
  },  
  'inProgress' : function() {
    var mediaId = Template.parentData()._id
    var mediaKey = filename2key(mediaId)
    if (!mediaKey || !this.mediaStatus || !this.mediaStatus[mediaKey]) {
      return false
    }
    //var res = (this.mediaStatus[mediaKey].progress > 0 && this.mediaStatus[mediaKey].progress < 1 )
    var res = (this.mediaStatus[mediaKey].downloading )
    return res
  },
  'scheduled' : function() {
    var mediaId = Template.parentData()._id
    var mediaKey = filename2key(mediaId)
    if (!mediaKey || !this.mediaStatus || !this.mediaStatus[mediaKey]) {
      return false
    }
    var res = (this.mediaStatus[mediaKey].required && !this.mediaStatus[mediaKey].available && !this.mediaStatus[mediaKey].progress )
    return res
  }  
});

Template.setupCell.events({
  'change .available': function (event) {
    var mediaElem = Template.parentData()
    if (event.target.checked) {
      Meteor.call('addMediaavail', { 'mediaId':mediaElem.name, 'playerId':this._id });
    }
    else {
      Meteor.call('removeMediaavail', { 'mediaId':mediaElem.name, 'playerId':this._id });
    }    
  },
  'click button' : function(event) {
    var mediaElem = Template.parentData()
    console.log(event.target + " clicked")
    if ($(event.target).hasClass("add_media")) {
      Meteor.call('setPlayerMediaStatus', { 'mediaId':mediaElem.name, 'playerId':this._id, attr: 'required', value: true });
    }
    else {
      Meteor.call('setPlayerMediaStatus', { 'mediaId':mediaElem.name, 'playerId':this._id, attr: 'required', value: false });
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
  'img' : function() {
    var mediaElem = Template.parentData()
    var player = Players.findOne({"_id":this._id})
    var media = Media.findOne({"name":mediaElem.name})
    return typeof(media)!="undefined" && media.target == "img"
  },    
  'playtimestring': function() {
    //return this.playStart + " " + this.playOffset
    if (this.playStart)
      return Date.now() - this.playStart + this.playOffset
    if (this.playOffset > 0)
      return this.playOffset
    else
      return "-"
  },
  'isMediaStream':function(){
    var mediaElem = Template.parentData()
    return mediaElem.stream
  },
  'videoLocallyAvailable':function(){
    var mediaElem = Template.parentData()
    return this.locallyAvailableVideos && this.locallyAvailableVideos.indexOf(mediaElem.url) >= 0
  },  
  'checked':function(){
    var mediaElem = Template.parentData()
    return this.filename == mediaElem.name
  },
  'loopChecked':function(){
    var mediaElem = Template.parentData()
    var player = this
    return ( player.loop && player.loop.indexOf(mediaElem._id) >= 0 ? { 'checked' : 'checked' } : null )
  },  
  'inProgress' : function() {
    var mediaId = Template.parentData()._id
    var mediaKey = filename2key(mediaId)
    if (!mediaKey || !this.mediaStatus || !this.mediaStatus[mediaKey]) {
      return false
    }
    //var res = (this.mediaStatus[mediaKey].progress > 0 && this.mediaStatus[mediaKey].progress < 1 )
    var res = (this.mediaStatus[mediaKey].downloading )
    return res
  },  
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
  'click .resync' : function(event){
    Meteor.call('resync', { playerId: this._id })
  },  
  'click .loop' : function(event) {
    var mediaElem = Template.parentData()
    player = this
    if (!player.loop) player.loop = []
    if (player.loop.indexOf(mediaElem._id) >= 0) { 
      Players.update({'_id':this._id},{$pull :{'loop': mediaElem._id}})
    } 
    else {
      if( Object.prototype.toString.call( this.loop ) === '[object Array]' ) {
        Players.update({'_id':this._id},{$push :{'loop': mediaElem._id}})
      }
      else {
        Players.update({'_id':this._id},{$set :{'loop': [] }})
      }
    }
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

Template.uploadIndicator.helpers({
  'percentage': function () {
    var mediaId = Template.parentData()._id
    if (!mediaId) return false
    var mediaKey = filename2key(mediaId)
    if (!this.mediaStatus) return false
    var mediaItem = this.mediaStatus[mediaKey]

    //console.log(mediaItem)

    if (mediaItem && mediaItem.progress && mediaItem.progress < 1) {
      return Math.round(mediaItem.progress * 100)
    }
  },
});
