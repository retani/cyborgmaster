/*
function openDataChannel (){
	var config = {"iceServers":[{"url":"stun:stun.l.google.com:19302"}]};
	var connection = { 'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true }] };

	peerConnection = new webkitRTCPeerConnection(config, connection);
	peerConnection.onicecandidate = function(e){
    if (!peerConnection || !e || !e.candidate) return;
    var candidate = event.candidate;
    sendNegotiation("candidate", candidate);
	}

	dataChannel = peerConnection.createDataChannel(
		"datachannel", {reliable: false});

	dataChannel.onmessage = function(e){
    console.log("DC from ["+user2+"]:" +e.data);
	}
	dataChannel.onopen = function(){
    console.log("------ DATACHANNEL OPENED ------")
    $("#sendform").show();
	};
	dataChannel.onclose = function(){console.log("------ DC closed! ------")};
	dataChannel.onerror = function(){console.log("DC ERROR!!!")};

	peerConnection.ondatachannel = function () {
    console.log('peerConnection.ondatachannel event fired.');
	};
}
*/

/********************************** */

/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */

var mediaRecorder;
var recordedBlobs;
var sourceBuffer;
var gumVideo;

function initMediaRecorder(){

  var constraints = {
    audio: true,
    video:  {mandatory: {
      maxWidth: 320,
      maxHeight: 240,
      maxAspectRatio:4/3,
      maxFrameRate:10
      },
      optional: [ ]
    },
  };

	window.mediaSource = new MediaSource();
	mediaSource.addEventListener('sourceopen', handleSourceOpen, false);

	gumVideo = document.querySelector('#own_video');
	console.log(gumVideo)

	navigator.mediaDevices.getUserMedia(constraints).
    then(handleSuccess).catch(handleError);
}
//recordButton.onclick = toggleRecording;
//downloadButton.onclick = download;


function handleSuccess(stream) {
  console.log('getUserMedia() got stream: ', stream);
  window.stream = stream;
  if (window.URL) {
    gumVideo.src = window.URL.createObjectURL(stream);
  } else {
    gumVideo.src = stream;
  }
}

function handleError(error) {
  console.log('navigator.getUserMedia error: ', error);
}

function handleSourceOpen(event) {
  console.log('MediaSource opened');
  sourceBuffer = mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
  console.log('Source buffer: ', sourceBuffer);
}

function handleDataAvailable(event) {
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

function handleStop(event) {
  console.log('Recorder stopped: ', event);
}

function startRecording() {
  recordedBlobs = [];
  var options = {mimeType: 'video/webm;codecs=vp9'};
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    console.log(options.mimeType + ' is not Supported');
    options = {mimeType: 'video/webm;codecs=vp8'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log(options.mimeType + ' is not Supported');
      options = {mimeType: 'video/webm'};
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.log(options.mimeType + ' is not Supported');
        options = {mimeType: ''};
      }
    }
  }
  try {
    mediaRecorder = new MediaRecorder(window.stream, options);
  } catch (e) {
    console.error('Exception while creating MediaRecorder: ' + e);
    alert('Exception while creating MediaRecorder: '
      + e + '. mimeType: ' + options.mimeType);
    return;
  }
  console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
  mediaRecorder.onstop = handleStop;
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.start(10); // collect 10ms of data
  console.log('MediaRecorder started', mediaRecorder);
}

function stopRecording() {
  mediaRecorder.stop();
  console.log('Recorded Blobs: ', recordedBlobs);
}

function uploadRecordedVideo(callback) {
  var blob = new Blob(recordedBlobs, {type: 'video/webm'});
  var upload_callback = callback;

  var reader = new FileReader();
  reader.onload = function(event) {
    console.log("uploading " + event.loaded + " bytes")
    var res = Meteor.call('transferVideoBlob',{data: event.target.result, player: playerId }, function(){
      console.log("upload done")
      if (upload_callback) upload_callback()
    })
  }
  reader.readAsDataURL(blob);

  /*
  var url = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = 'test.webm';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
  */
}