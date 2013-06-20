var isok=require('../lib/isok').isok;
var async=require('async');
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'view_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='view'){
			view(conn.uid,data,sql,callback);
		}
	});
}
function view(uid,data,sql,callback){
	if(isNaN(data))return;
	var pid=parseInt(data);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query("SELECT pid,problem_title,problem_description,problem_input,problem_output,problem_hint,elo FROM xjos.problem WHERE pid="+sqlc.escape(pid),
		function(err,rows){
			callback(err,sqlc,rows[0]);
		});
	},
	function(sqlc,pobj,callback){
		sqlc.query('SELECT MAX(sid) AS smid FROM xjos.submit WHERE uid='+sqlc.escape(uid)+' AND pid='+sqlc.escape(sqlc.escape(pid)),
		function(err,rows){
			callback(err,pobj,rows[0].smid);
			sqlc.end();
		});
	},
	function(pobj,smid,cb){
		pobj.sid=smid;
//		console.log(JSON.stringify(pobj));
		callback(JSON.stringify(pobj));
		cb();
	}],
	function(err){
		if(pid===NaN)
			return;
		if(err)
			console.log('VIEW ERROR:'+err);
	});
}
