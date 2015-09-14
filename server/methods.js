Meteor.methods({
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
  'setFilename': function (data) {
    console.log("receiving media selection " + data.filename + " from " + data.playerId)
    var playerId = data.playerId
    var filename = data.filename
    Players.update({_id:playerId}, { $set : {'filename':filename} })
    return state
  }  
})