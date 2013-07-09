var isok=require('../lib/isok').isok;
var async=require('async');
var libuser=require('./libuser');
var srvlog=require('../lib/log').srvlog;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'view_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='view'){
			view(conn.uid,data,sql,callback);
		}else if(handle==='sample'){
			sample(conn.uid,data,sql,callback);
		}else if(handle==='gettjda'){
			input(conn.uid,data,sql,callback);
		}
	});
}
function input(uid,data,sql,callback){
	if(isNaN(data))return;
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
		sqlc.query('SELECT istjda FROM xjos.problem WHERE pid='+sqlc.escape(parseInt(data))+' AND levelt<='+sqlc.escape(level),
		function(err,rows){
			if(err){callback(err,rows);sqlc.end();}
			else if(rows.length<1){callback('User:'+uid+' has No Priv To Visit Prob:'+parseInt(data));sqlc.end();}
			else if(rows[0].istjda==0){callback('User:'+uid+' want to visit input '+parseInt(data)+' which is not tjda');sqlc.end();}
			else callback(err,sqlc,parseInt(data));
		});
	},
	function(sqlc,pid,callback){
		sqlc.query('SELECT problem_data_input FROM xjos.problem_data WHERE pid='+sqlc.escape(pid),
		function(err,rows){
			sqlc.end();
			callback(err,rows);
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			srvlog('A','ProbView.Input:'+err);
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
		libuser.getlevel(uid,sql,function(level){
			callback(null,sqlc,level);
		});
	},
	function(sqlc,level,callback){
		sqlc.query('SELECT problem_sample_input AS input, problem_sample_output AS output, problem_sample_id AS psid FROM xjos.problem_sample JOIN xjos.problem ON problem.pid=problem_sample.pid WHERE problem_sample.pid='+sqlc.escape(pid)+' AND problem.levelt<='+sqlc.escape(level)+' ORDER BY problem_sample_id ASC',
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
function view(uid,data,sql,callback){//FIXME:Not Look Like good
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
		sqlc.query("SELECT pid,problem_title,problem_description,problem_input,problem_output,problem_hint,elo,spjid,istjda FROM xjos.problem WHERE pid="+sqlc.escape(pid)+' AND levelt<='+sqlc.escape(level),
		function(err,rows){
			if(err){
				srvlog('A','ProbView:SQL Error:'+err+' data:'+data);
//				console.log('ProbViewErr:'+err);
				sqlc.end();
				callback('err');
				return;
			}else if(rows.length>0){
				callback(err,sqlc,rows[0]);
			}else{
				sqlc.end();
				srvlog('B','uid:'+uid+' ProbView NoPriv/NoProb');
				callback('ProbView NoPriv/NoProb');
			}
		});
	},
	function(sqlc,pobj,callback){
		sqlc.query('SELECT MAX(sid) AS smid FROM xjos.submit WHERE uid='+sqlc.escape(uid)+' AND pid='+sqlc.escape(sqlc.escape(pid)),
		function(err,rows){
			if(rows.length==0)pobj.sid=-1;
			else pobj.sid=rows[0].smid;
			callback(err,pobj,sqlc);
		});
	},
	function(pobj,sqlc,callback){
		sqlc.query('SELECT lid FROM xjos.problem_language_table WHERE pid='+sqlc.escape(pid),function(err,rows){
			pobj.allowLanguage=rows;
			callback(err,pobj);
			sqlc.end();
		});
	},
	function(pobj,cb){
//		console.log(JSON.stringify(pobj));
		callback(JSON.stringify(pobj));
		cb();
	}],
	function(err){
//		if(err)
//			console.log('VIEW ERROR:'+err);
		return;
	});
}
