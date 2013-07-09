var async=require('async'),
	crypto=require('crypto'),
	vars=require('../commonvars'),
	isok=require('../lib/isok').isok;
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(conn.uid==null){
		return;
	}
	if(handle==='add'){
//		isok(conn.uid,'edit_problem',sql,function(isk){
//			if(isk!=0)
		add(conn.uid,data,sql,callback);
//		});
	}
}
function makeuuid(){
	return crypto.pseudoRandomBytes(16).toString('hex');
}
function add(uid,data,sql,callback){
	var postuuid=makeuuid();
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		var obj={'ptuuid':postuuid,'info':data,date:new Date(),'uid':uid};
		sqlc.query('INSERT INTO xjos.posttable SET '+sqlc.escape(obj),function(err,rows){
			if(err)callback(err);
			else callback(null);
			sqlc.end();
		});
	},
	function(cb){
		callback(vars.dynurl+'/'+postuuid);
	}],
	function(err){
		console.log('REGPOST-ERR:'+err);
	});
}
