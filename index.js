var server=require('./server');
var route=require('./route');
var ws=require('./ws');
var mysql=require('./mysql');
var wshandler=require('./wshandler');
var EventEmitter=require('events').EventEmitter;
var eventbus=new EventEmitter();
//console.log(JSON.stringify(eventbus));
var judtcp=require('./jugtcpserver');
var simpledb={};
var srvlog=require('./lib/log').srvlog;

//require('daemon')(null,null,{stdout:'logstd',stderr:'logerr'});
//require('daemon')();

var handle={}
handle['NOTFOUND']=require('./404').mainfun;

//process.on('uncaughtException', 
//function(err){
//	srvlog('S','uncaughtException:'+err);
//	console.trace(label);
//});
process.on('exit',
function(){
	srvlog('BSync','Process Exited');
});
srvlog('BSync','Process Started');

ws.start(server.start(route.route,handle,mysql.pool),mysql.pool,wshandler,eventbus,simpledb);
judtcp.start(eventbus);
