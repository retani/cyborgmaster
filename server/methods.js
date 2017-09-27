Meteor.methods({
  'reloadVideos': function () {
    console.log(publishedMedia, "saving in " + process.env.PWD)
    fs.writeFile(process.env.PWD + '/reload.js', 'var last_reload_timestamp = "'+Date.now()+'"', function(err){
      if (err) throw err;
      console.log('It\'s saved!');
    });
  },
  'updatePreselected' : function (set) {
    if (set.state == "play" && Players.find({ 'preselect': { $type: 2 }, 'type':'rpi', 'state':'stop' }).count() > 0) {// special case, sync raspberries
      console.log("sync rpi")
      Players.update( { 'preselect': { $type: 2 }, 'type':'rpi' }, { $set : { state:'play'} }, {multi:true} )
      Meteor.setTimeout(function(){
        Players.update( { 'preselect': { $type: 2 }, 'type':'rpi' }, { $set : { state:'pause'} }, {multi:true} )
        Meteor.setTimeout(function(){
          Players.update( { 'preselect': { $type: 2 } }, { $set : set }, {multi:true} )
        },2000)
      },500)
    }
    else {
      Players.update( { 'preselect': { $type: 2 } }, { $set : set }, {multi:true} )
    }
  },
  'addMediaavail' : function (doc) {
    Mediaavail.upsert( doc, doc )
  },
  'removeMediaavail' : function (doc) {
    Mediaavail.remove( doc )
  },  
  'setState': function (data) {
    console.log("receiving state " + data.state + " from " + data.playerId)
    var playerId = data.playerId
    var state = data.state
    Players.update({_id:playerId}, { $set : {'state':state} })
    return state
  },
  'setStreamId': function (data) {
    console.log("receiving streamId " + data.streamId + " from " + data.playerId)
    var playerId = data.playerId
    var streamId = data.streamId
    Players.update({_id:playerId}, { $set : {'streamId':streamId} })
    return streamId
  },
  'setGlobal': function(data) {
    console.log("set global "+data.name+" as "+data.value)
    Globals.upsert({'name':data.name},{ $set : {'value' : data.value}})
  },
  'setFilename': function (data) {
    console.log("receiving media selection " + data.filename + " from " + data.playerId)
    var playerId = data.playerId
    var filename = data.filename
    Players.update({_id:playerId}, { $set : {'filename':filename} })
    return filename
  },
  'setPlayerMediaStatus' : function(data) {
    var playerId = data.playerId
    var mediaId = data.mediaId
    var attrs =  ( Array.isArray(data.attr) ? data.attr : [data.attr] )
    var values = ( Array.isArray(data.value) ? data.value : [data.value] )
    for (var i = 0; i<attrs.length; i++) {
      var attr = attrs[i]
      var value = values[i]
      var set = {}
      set["mediaStatus." + filename2key(mediaId) + "." + attr] = value
      Players.update({_id:playerId}, { $set : set })
      console.log("set media status on " + playerId +": " + "'" + mediaId + "'." + attr + " = " + value, set)      
    }
  },
  'labels':function (show) {
    console.log("switching labels " + (show ? "on" : "off"))
    Players.update({},{ $set : {'show_labels' : show}},{multi:true})
  },
  'playDelay':function (value) {
    console.log("switching play_delay " + (value ? "on" : "off"))
    Meteor.call('setGlobal', { name: 'play_delay', value: value})
    //Players.update({},{ $set : {'play_delay' : value}},{multi:true})
  },  
  'playersPing':function(){
    Players.update({}, {$set:{'pingback':0, 'pingtime':Date.now()}},{multi:true});
    //console.log("ping sent")
  },
  'playerPingback':function(playerId){
    Players.update({'_id':playerId},{$inc:{'pingback':1}})
    Players.update({'_id':playerId, 'pingback':0 }, {$set:{'connected':false}}, {multi:true});
    Players.update({'_id':playerId, 'pingback':{$gt:0} }, {$set:{'connected':true}}, {multi:true});
    //console.log("ping received from " + playerId)
  }
})