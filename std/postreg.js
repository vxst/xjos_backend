var async=require('async'),
	crypto=require('crypto');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(conn.uid==null){
		return;
	}
	if(handle==='add'){
		add(conn.uid,data,sql,callback);
	}
}
function makeuuid(){
	return crypto.pseudoRandomBytes(12).toString('hex');
}
function add(uid,data,sql,callback){
	var postuuid=makeuuid();
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		var obj={'ptuuid':postuuid,'info':data,date:new Date()};
		sqlc.query('INSERT INTO xjos.posttable SET '+sqlc.escape(obj),function(err,rows){
			if(err)callback(err);
			else callback(null);
		});
	},
	function(cb){
		callback(postuuid);
	}],
	function(err){
		console.log('REGPOST-ERR:'+err);
	});
}
