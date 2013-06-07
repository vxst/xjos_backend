var WebSocketServer = require('websocket').server;
var http = require('http');
var crypto=require('crypto');


function originIsAllowed(origin) {
// put logic here to detect whether the specified origin is allowed.
// as for now only xjos.org are allowed
	if(origin=='https://xjos.org')
		return true;
	return false;
}
function protocolIsAllowed(protocol_list) {
	for(sui in protocol_list){
		if(protocol_list[sui]==='xjpipeline-protocol'){
			return true;
		}
	}
	return false;
}

exports.start=function(server,sqlpool,wshandler,eventbus){
	wsServer = new WebSocketServer({
		httpServer: server,
		autoAcceptConnections: false, //false is needed for security reason in the protocol
		keepaliveInterval:30000,
		fragmentationThreshold:65536,
		maxReceivedMessageSize:1024*1024*8
	});
	var connectionpool=new Array();//,counter=0;
	wsServer.on('request', function(request) {
		if (!originIsAllowed(request.origin)) {
		  // Make sure we only accept requests from an allowed origin
		  request.reject();
		  console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		  return;
		}
		if(!protocolIsAllowed(request.requestedProtocols)){
			console.log((new Date()) + ' Unsupported protocol list detected');
			var protocol_list=request.requestedProtocols;
			for(i in protocol_list){
				console.log('::'+protocol_list[i]);
			}
			request.reject();
			return;
		}

		var connection = request.accept('xjpipeline-protocol', request.origin);
//		connection.uid=undefined;
		connection.uid=1;//Login as 1
		console.log((new Date()) + ' Connection accepted.');
		connection.bin_ct=0;//Used to handle binary Infomations
		connection.bin_arg={};
		var IID=setInterval(function(conn){return function(){conn.sendUTF('@0000000_nsksui_live');}}(connection),20000);
		connection.on('close', function(){clearInterval(IID)});
		connection.on('message', function(message) {
			if (message.type === 'utf8') {
				wshandler.handle(message.utf8Data,connection,sqlpool,eventbus);
			}
			else if (message.type === 'binary') {
//				console.log('Why Received Binary Message of ' + message.binaryData.length + ' bytes?');
//				connection.sendBytes(message.binaryData);
				wshandler.binhandle(message.binaryData,connection,sqlpool,eventbus);
			}
		});
		connection.on('close', function(reasonCode, description) {
			console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
		});
		connectionpool.push(connection);
	});
	console.log('WebSocket server has started too');
}
