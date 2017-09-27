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