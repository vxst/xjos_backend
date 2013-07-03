var isok=require('../lib/isok').isok;
var async=require('async');
var libuser=require('./libuser');
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'view_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='view'){
			view(conn.uid,data,sql,callback);
		}else if(handle==='sample'){
			sample(conn.uid,data,sql,callback);
		}
	});
}
//Get samples for one problem
function sample(uid,data,sql,callback){
	if(isNaN(data))return;
	var pid=parseInt(data);
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT problem_sample_input AS input, problem_sample_output AS output, problem_sample_id AS psid FROM xjos.problem_sample WHERE pid='+sqlc.escape(pid)+' ORDER BY problem_sample_id ASC',
		function(err,rows){
			callback(err,rows);
			sqlc.end();
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			console.log('PSample Error:'+JSON.stringify(err));
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
		libuser.getlevel(uid,sql,function(level){
			callback(null,sqlc,level);
		});
	},
	function(sqlc,level,callback){
		sqlc.query("SELECT pid,problem_title,problem_description,problem_input,problem_output,problem_hint,elo FROM xjos.problem WHERE pid="+sqlc.escape(pid)+' AND levelt<='+sqlc.escape(level),
		function(err,rows){
			if(err){
				console.log('ProbViewErr:'+err);
				return;
				callback('err');
			}else if(rows.length>0){
				callback(err,sqlc,rows[0]);
			}else{
				callback('ProbView NoPriv/NoProb');
			}
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
