var WebSocketServer = require('websocket').server;
var http = require('http');
var crypto=require('crypto');
var serverlog=require('./lib/log').srvlog;


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
		maxReceivedMessageSize:4*1024*1024,
		maxReceivedFrameSize:4*1024*1024
	});
	var connectionpool=new Array();//,counter=0;
	simpledb.connectionCountDB={};
	wsServer.on('request', function(request) {
		var ip=request.remoteAddress;
		if (!originIsAllowed(request.origin)) {
			// Make sure we only accept requests from an allowed origin
			request.reject();
			serverlog('B',(new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
			return;
		}
		if(!protocolIsAllowed(request.requestedProtocols)){
			serverlog('B',(new Date()) + ' Unsupported protocol list detected');
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
			serverlog('C','Too many connection From Single IP,Connection From IP:'+request.remoteAddress+' rejected');
			return;
		}

		serverlog('C',(new Date()) + ' Connection From IP:'+request.remoteAddress+' accepted');

		var connection = request.accept('xjpipeline-protocol', request.origin);
		simpledb.connectionCountDB[request.remoteAddress]+=1;

		connection.uid=undefined;
		connection.ip=ip;


		connection.on('message', function(message) {
			var ktime=Math.round((new Date()).getTime()/5000);
			if(connection.lastTime===undefined)
				connection.lastTime=0;
			if(connection.lastTimeCount===undefined)
				connection.lastTimeCount=0;
			if(connection.lastTime===ktime){
				connection.lastTimeCount+=1;
				if(connection.lastTimeCount>=30)
					return;
			}else{
				connection.lastTime=ktime;
				connection.lastTimeCount=0;
			}
			if (message.type === 'utf8') {
//				wshandler.handle(message.utf8Data,connection,sqlpool,eventbus);
				serverlog('B','UTF8 Message:'+JSON.stringify(message.utf8Data)+' From IP:'+connection.ip+' Maybe UID:'+connection.uid)
			}
			else if (message.type === 'binary') {
				wshandler.handle(message.binaryData,connection,sqlpool,eventbus);
//				console.log('Why Received Binary Message of ' + message.binaryData.length + ' bytes?');
//				connection.sendBytes(message.binaryData);
//				wshandler.binhandle(message.binaryData,connection,sqlpool,eventbus);
			}
		});
		connection.on('close', function(reasonCode, description) {
			serverlog('C',(new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected:'+reasonCode+':'+description);
			simpledb.connectionCountDB[request.remoteAddress]-=1;
		});
		connectionpool.push(connection);
	});
	console.log('WebSocket server has started too');
}
