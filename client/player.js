var isIOSDevice = require('ios-detector');

Template.player.helpers({
  'playerId': function () {
    return playerId
  },
  'player': function () {
    return Players.findOne({"_id":playerId})
  },
  'info': function () {
    var player = Players.findOne({"_id":playerId})
    return player.info
  },
  'additionalInfo': function() {
    var play_delay = Globals.findOne({name:"play_delay"})
    if (play_delay && play_delay.value==true ) {
      //TimeSync.serverTime()
      return "round trip: " + TimeSync.roundTripTime() + "ms"
    }
  },
  'show_info': function() {
    return Players.findOne({"_id":playerId}).show_labels
  },
  'show_list': function() {
    var player = Players.findOne({"_id":playerId})
    if (player.type == "screen" && player.manual == "allow") {
      return typeof(player)=="undefined" || player.state == "stop"
    }
  },
  'list': function() {
    return Media.find()
  },
  'mediaURL':function(mediaId){
    var media = Media.findOne(mediaId)
    var mediaserver_address = getGlobalValue("mediaserver_address")
    var mediaserver_path = getGlobalValue("mediaserver_path")  
    return "http://" + mediaserver_address + "/" + mediaserver_path + media.name
  },
  'isCurrentMedia' : function() {
    var player = Players.findOne({"_id":playerId})
    return this.name == player.filename
  },
  'loop': function() {
    var player = Players.findOne({"_id":playerId})
    var media = Media.findOne({"name":player.filename})
    return ( typeof(media) != "undefined" && Array.isArray(player.loop) && player.loop.indexOf(media._id) >= 0 ? {'loop':'loop'} : null )
  },
  'isLooping': function() {
    var player = Players.findOne({"_id":playerId})
    var media = Media.findOne({"name":player.filename})
    return typeof(media) != "undefined" && Array.isArray(player.loop) && player.loop.indexOf(media._id) >= 0
  },
  'isRecordingClass': function(){
    return this.isRecording ? 'recording' : null
  },
  'iframe' : function() {
    var player = Players.findOne({"_id":playerId})
    var media = Media.findOne({"name":player.filename})
    return typeof(media)!="undefined" && media.target == "iframe"
  },  
  'iframeURL' : function() {
    var player = Players.findOne({"_id":playerId})
    var media = Media.findOne({"name":player.filename})
    return typeof(media)!="undefined" && media.url
  },
  'img' : function() {
    var player = Players.findOne({"_id":playerId})
    var media = Media.findOne({"name":player.filename})
    return typeof(media)!="undefined" && media.target == "img"
  },  
  'imgURL' : function() {
    var player = Players.findOne({"_id":playerId})
    var media = Media.findOne({"name":player.filename})
    return typeof(media)!="undefined" && media.url
  },
  'streamsExist':function(){
    return Players.find({stream:true}).count() > 0
  },
  'mute':function(){
    return null // isIOSDevice() ? {mute:"mute"}: null
  }  
});

Template.player.events({
  'ended #player video' : function() {
    Players.update({"_id":playerId}, { $set : {"state":"stop"}})
  },
  'load img': function() {
    console.log("img loading complete")
  },
  'canplay video': function() {
    console.log("video loading complete")
  },  
  'click .medialist .indicator' : function () { /*.currentMedia*/
    var player = Players.findOne({"_id":playerId})
    var media = this
    if (player.state != "play") {
      if (media.name !== player.filename) {
        Meteor.call('setFilename', { playerId: playerId, filename: media.name }, function() {
          Meteor.call('setState', { playerId: playerId, state: "play" })  
        })
      }
      else {
        Meteor.call('setState', { playerId: playerId, state: "play" })
      }
    }
  }
})

Template.player.onCreated(function(){
  template = this
  this.subscribe('globals', function(){
    template.autorun(function(){
      var play_delay = Globals.findOne({name:"play_delay"})
      var mediaserver_address = getGlobalValue("mediaserver_address")
      var mediaserver_path = getGlobalValue("mediaserver_path")
      //var show_labels = Globals.findOne({name:"show_labels"}) // TODO
      if (play_delay && play_delay.value==true) {
        syncinterval = Meteor.setInterval(function(){
          TimeSync.resync()
        }, 5000)      
      }
      else {
        if (typeof(syncinterval)!="undefined") {
          Meteor.clearInterval(syncinterval)
        }
      }
    })
  });  
})

Template.player.onRendered( function() {
  this.subscribe('players', {playerId: playerId},  function(){
    console.log("rendered player " + playerId)
    $("body").css("overflow","hidden")
    console.log(Players.find().fetch())
    var player = Players.findOne({"_id":playerId})
    var videoElem = $("#video").get(0)

    var video_constraints = {mandatory: {
      maxWidth: 320,
      maxHeight: 240,
      maxAspectRatio:4/3,
      maxFrameRate:10
      },
      optional: [ ]
    };

    SimpleWebRTC_onload = function(){
      setTimeout(function(){
          var signaling = 'https://'+mediaserver_address+':443/';
          console.log("signal server: " + signaling);
        webrtc = new SimpleWebRTC({
            // the id/element dom element that will hold "our" video
            localVideoEl: 'own_video',
            // the id/element dom element that will hold remote videos
            remoteVideosEl: 'stream_video_container',
            // immediately ask for camera access
            autoRequestMedia: true,
            url: signaling,
            media: { video: player.stream ? video_constraints : false, audio: false}
        });

        webrtc.on('videoAdded', function (elem, peer) {
          // hide all except desired
          console.log("added video")
          toggleStreamVideos()
        })


        // we have to wait until it's ready
        webrtc.on('readyToCall', function (streamId) {
          if (typeof initMediaRecorder !== "undefined") initMediaRecorder(); // from stream.js
          Meteor.call('setStreamId', { playerId: playerId, streamId: streamId })
          webrtc.joinRoom("playmaster", function(){
            console.log("joined")
          });
          webrtc.createRoom("playmaster", function(){
            webrtc.joinRoom("playmaster", function(){
              console.log("joined")
            });
          });

          if (player.streaming) {
            webrtc.resume()
          } else {
            webrtc.pause()
          }
      
          console.log("streaming to: playmaster")
        });
      },2000)
    }

    streamObserver = Players.find().observeChanges({
      changed: function(id, doc) {
        if (doc.filename == "stream:"+playerId) {
          console.log("someone plays me")
          webrtc.joinRoom("playmaster")
        }
      }
    })

    observer = Players.find({ "_id" : playerId }).observeChanges({
      changed: function(id, doc) {
        if (doc.pingtime) {
          //console.log("pingback",playerId)
          if (typeof(videoElem) == "undefined") videoElem = $("#video").get(0)
          Meteor.call('playerPingback', playerId, function (error, result) {});
        }
        if (FlowRouter.getRouteName() == "player")
        //console.log(doc);
        // handle video recording
        if (typeof doc.isRecording !== "undefined") {
          if (doc.isRecording) {
            startRecording()
          } else {
            stopRecording()
            Players.update(playerId, {$set:{isUploading: true}})
            setTimeout(function(){
              uploadRecordedVideo(function(){
                Players.update(playerId, {$set:{isUploading: false}})
              })
            }, 1000)
            //uploadRecordedVideo()
          }
        }

        //handle streaming on/off
        if (typeof doc.streaming !== "undefined") {
          if (doc.streaming) {
            webrtc.resume()
          } else {
            webrtc.pause()
          }
        }

        // handle resync
        if (typeof doc.resync !== "undefined") {
          console.log("resync", doc.resync)
          var time_s = doc.resync/1000;

          if (time_s >= videoElem.duration){
            console.log("video ended before resync")
            Players.update({"_id":playerId}, { $set : { "state":"stop", "filename":null } } ) // reset
            return
          }

          var p = Players.findOne({"_id":playerId})
          console.log("player state: " + p.state)
          if (p && p.state == "play") {
            //videoElem.pause(); 
            videoElem.play(); 
            setTimeout(()=>{
              console.log("resync with delay")
              videoElem.currentTime = time_s + 0.2
            }, 200)
          } else {
            videoElem.currentTime = time_s
          }

          //doc.filename = player.filename
          //doc.state = player.state

          setTimeout(()=>{
            //if (player.state == "pause")  videoElem.pause()
            //if (player.state == "play")  videoElem.play()
            ////videoElem.currentTime = doc.resync + 1100
          },1100)


          //videoElem.currentTime = doc.resync/1000
          //if (player.state == "play")  videoElem.play()
   
          setTimeout(()=>{
            //videoElem.currentTime = doc.resync + 2100
          },2100)
        }

        // handle filename
        if (doc.filename) {
          TimeSync.resync();
          if (doc.filename.indexOf('stream:')===0) {
            currentStream = doc.filename.substr('stream:'.length);
            console.log("now streaming " + currentStream)
            toggleStreamVideos()
          } else {
            currentStream = undefined;
            toggleStreamVideos()
            if (player.type == "screen") {
              if (player.locallyAvailableVideos && player.locallyAvailableVideos.indexOf(Media.findOne(doc.filename).url) >= 0) {
                videoElem.src = "http://localhost/" + Media.findOne(doc.filename).url
                console.log("playing video from localhost")
              }
              else
                var mediaserver_address = getGlobalValue("mediaserver_address")
                var mediaserver_path = getGlobalValue("mediaserver_path")
                videoElem.src = "http://" + mediaserver_address + "/" + mediaserver_path + doc.filename
            } else {
              videoElem.src = "http://localhost/" + doc.filename
            }
            if (player.specialPreload && !doc.state) {
              mobileBrowserPreload("init", videoElem)
            }
          }
        }

        // handle state
        if (doc.state) {
          if (mobileBrowserPreloadActive) {
            mobileBrowserPreload("abort", videoElem)
          }
          if (doc.state == "play") {
            var play_delay = Globals.findOne({name:"play_delay"})
            if (play_delay && play_delay.value == true) {
              TimeSync.resync();
              Meteor.setTimeout(function(){ videoElem.play() 
                console.log("play delayed", TimeSync.roundTripTime()/2)
                Meteor.setTimeout(function(){ videoElem.play() }, 1000-(TimeSync.roundTripTime()/2)) // compensate
              }, 1000) // wait for resync to finish
              
            }
            else {
              videoElem.play()
            }
          }
          else if (doc.state == "pause") {
            videoElem.pause()
          }
          else if (doc.state == "stop") {
            videoElem.pause()
            videoElem.currentTime = 0
            // if (webrtc) webrtc.pauseVideo();
          }
        }
        if (typeof doc.volume != "undefined") {
          videoElem.volume = doc.volume
          console.log(doc.volume)
        }
      }
    });
 
/*    
    //setTimeout(()=>{
      
      if (player.type == "screen" && (!player.target || player.target == "video") && player.state == "play") {
        console.log("restoring player - " + player.state +" " +player.filename, videoElem)
        if (typeof(videoElem) == "undefined") videoElem = $("#video").get(0)
        videoElem.src = "http://" + mediaserver_address + "/" + mediaserver_path + player.filename
        setTimeout(()=>{
          //videoElem.currentTime = doc.resync + 2100
          videoElem.play()
          Meteor.call('resync', { playerId: playerId })
        },1100)
        
        // Players.update({"_id":playerId}, { $set : { "filename":"play", "filename":player.filename } } )
      }
    //},2100)
    else Players.update({"_id":playerId}, { $set : { "state":"stop", "filename":null } } ) // reset
*/
    Players.update({"_id":playerId}, { $set : { "state":"stop", "filename":null } } ) // reset
    
    // serve locally if requested
    var thisPlayer = Players.findOne({"_id":playerId});
    var localServer = thisPlayer && thisPlayer.localServer;
    if (localServer) {
      console.log("This device has a local webserver");
      //console.log(Media.find().fetch())
      mediaObserver = Media.find().observeChanges({
        added: function(id, doc) {
          var test_url = 'http://localhost' + doc.url;
          console.log("checking for: " + test_url);

          $.ajax({
              url: 'http://localhost' + doc.url,
              success: function(){
                 console.log(doc.url + " is locally available")
                 Meteor.call('setLocallyAvailableVideo', { playerId: playerId, video: doc.url })
              },
              error: function(){
                 console.log(doc.url + " is not locally available")
              },              
              timeout: 1000 
          });

        }
      })      
    }


  })

});

toggleStreamVideos = function() {
  if (typeof currentStream != "undefined") {
    var goodStreamId = Players.findOne({_id: currentStream}).streamId
  }
  var vids = document.querySelectorAll('#stream_video_container video')
  console.log("toggle video streams")
  for (var i = 0, len = vids.length; i < len; i++) {
    if (vids[i].id.indexOf(goodStreamId) === 0) {
      vids[i].style.display = "block"
    } else {
      vids[i].style.display = "none"
    }
  }  
}

mobileBrowserPreloadActive = false
mobileBrowserPreload = function(action, videoElem) {
  if (action == "init") {
    videoElem.play()
    mobileBrowserPreloadActive = true
    var vE = videoElem
    setTimeout(function(){
      mobileBrowserPreload("abort", vE)
    }, 5000)
  }
  if (action == "abort") {
    videoElem.pause()
    videoElem.currentTime = 0
    mobileBrowserPreloadActive = false
  }
}

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
