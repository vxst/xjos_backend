var async=require('async');
exports.getlevel=function(uid,sql,cb){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT level FROM xjos.user WHERE uid='+sqlc.escape(uid),
		function(err,rows){
			if(err){
				console.log('getlevelerr:'+err);
			}else if(rows.length<1){
				console.log('XJOS UNDER ATTACK!:getlevelerr:No such user');
			}else{
				callback(err,rows[0].level);
			}
			sqlc.end();
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
