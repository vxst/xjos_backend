var isok=require('../lib/isok').isok;
var async=require('async');
var filter=require('./filter').htmlfilter;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'common',sql,
	function(ct){
		if(ct==0)return;
		else if(handle==='list'){//S0
			addtopic(conn.uid,data,sql,callback);
		}
	});
}
function addtopic(uid,data,sql,callback){
}
