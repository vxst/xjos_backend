var async=require('async');

exports.isok=function(uid,priv,sql,callback){
	if(isNaN(uid)){
		callback(0);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT count(*) AS priv FROM xjos.user_priv_table INNER JOIN xjos.priviledge_table ON user_priv_table.pvid=priviledge_table.pvid WHERE uid='+sqlc.escape(uid)+' AND title='+sqlc.escape(priv),
		function(err,rows){
			callback(err,rows[0].priv);
			sqlc.end();
		});
	},
	function(isok,cb){
		callback(isok);
		cb();
	}],
	function(err){
		if(err)
			console.log('PRIV_ERR:'+err);
	});
}
