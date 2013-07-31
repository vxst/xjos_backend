var async=require('async');
exports.getlevel=function(uid,sql,cb){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT level FROM xjos.user WHERE uid='+sqlc.escape(uid),
		function(err,rows){
			sqlc.end();
			if(err){
				console.log('getlevelerr:'+err);
				callback('err');
			}else if(rows.length<1){
				console.log('XJOS UNDER ATTACK!:getlevelerr:No such user');
				callback('err');
			}else{
				callback(err,rows[0].level);
			}
		});
	},
	function(level,callback){
		cb(level);
		callback();
	}],
	function(err){
		if(err)
			console.log(err);
	});
}
exports.getlevelc=function(uid,sqlc,cb){
	async.waterfall([
	function(callback){
		sqlc.query('SELECT level FROM xjos.user WHERE uid='+sqlc.escape(uid),
		function(err,rows){
			if(err){
				console.log('getlevelerr:'+err);
				callback(err);
			}else if(rows.length<1){
				console.log('XJOS UNDER ATTACK!:getlevelerr:No such user');
				callback('Unexisted uid in getlevel');
			}else{
				callback(err,rows[0].level);
			}
		});
	},
	function(level,callback){
		cb(level);
		callback();
	}],
	function(err){
		if(err)
			console.log(err);
	});
}
