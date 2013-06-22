var WebSocketServer = require('websocket').server;
var http = require('http');
var crypto=require('crypto');


function originIsAllowed(origin) {
// put logic here to detect whether the specified origin is allowed.
// as for now only xjos.org are allowed
	if(origin==='https://xjos.org')
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

exports.start=function(server,sqlpool,wshandler,eventbus,simpledb){
	wsServer = new WebSocketServer({
		httpServer: server,
		autoAcceptConnections: false, //false is needed for security reason in the protocol
		keepaliveInterval:30000,
		fragmentationThreshold:64*1024,
		maxReceivedMessageSize:16*1024*1024,
		maxReceivedFrameSize:1024*1024*16
	});
	var connectionpool=new Array();//,counter=0;
	simpledb.connectionCountDB={};
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

		if(simpledb.connectionCountDB[request.remoteAddress]==undefined)
			simpledb.connectionCountDB[request.remoteAddress]=0;
		if(simpledb.connectionCountDB[request.remoteAddress]>=3){
			request.reject(403,'Too many connections on a single IP');
			console.log('Connection From IP:'+request.remoteAddress+' rejected');
			return;
		}

		var connection = request.accept('xjpipeline-protocol', request.origin);
		simpledb.connectionCountDB[request.remoteAddress]+=1;
		connection.uid=undefined;

		console.log((new Date()) + ' Connection accepted.');

		connection.on('message', function(message) {
			var ktime=Math.Round((new Date()).getTime()/50);
			if(connection.lastTime===undefined)
				connection.lastTime=0;
			if(connection.lastTime===ktime)
				return;
			else
				connection.lastTime=ktime;
			if (message.type === 'utf8') {
				wshandler.handle(message.utf8Data,connection,sqlpool,eventbus);
			}
			else if (message.type === 'binary') {
				console.log('Why Received Binary Message of ' + message.binaryData.length + ' bytes?');
//				connection.sendBytes(message.binaryData);
//				wshandler.binhandle(message.binaryData,connection,sqlpool,eventbus);
			}
		});
		connection.on('close', function(reasonCode, description) {
			console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected:'+reasonCode+':'+description);
			simpledb.connectionCountDB[request.remoteAddress]-=1;
		});
		connectionpool.push(connection);
	});
	console.log('WebSocket server has started too');
}
