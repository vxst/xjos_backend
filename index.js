var server=require('./server');
var route=require('./route');
var ws=require('./ws');
var mysql=require('./mysql');
var wshandler=require('./wshandler');
var EventEmitter=require('events').EventEmitter;
var eventbus=new EventEmitter();
//console.log(JSON.stringify(eventbus));
var judtcp=require('./jugtcpserver');

//require('daemon')(null,null,{stdout:'logstd',stderr:'logerr'});
//require('daemon')();

var handle={}
handle['NOTFOUND']=require('./404').mainfun;

ws.start(server.start(route.route,handle),mysql.pool,wshandler,eventbus);
judtcp.start(eventbus);
