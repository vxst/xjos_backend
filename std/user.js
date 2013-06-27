var isok=require('../lib/isok').isok;
var async=require('async');
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'view_user',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='list'){
			list(conn.uid,data,sql,callback);
		}else if(handle==='view'){
			view(conn.uid,data,sql,callback);
		}
	});
	isok(conn.uid,'edit_user',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='edit'){
			edit(conn.uid,data,sql,callback);
		}else
		if(handle==='editpriv'){
			editpriv(conn.uid,data,sql,callback);
		}
	});
	if(handle==='editself'){
		editself(conn.uid,data,sql,callback);
	}
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
	var tuid=parseInt(data);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query("SELECT uid,username as un,email as em,realname as rn,nickname as nn,birthday as bd,gold,silver,level,rating,priv FROM xjos.user WHERE uid="+sqlc.escape(tuid),
		function(err,rows){
			if(err){
				console.log(err);
				return;
				callback(err);
			}else if(rows.length>0){
				callback(err,sqlc,rows[0]);
			}else{
				callback('No such user:UID:'+uid);
			}
		});
	},
	function(sqlc,pobj,callback){
		sqlc.query('SELECT priviledge_table.pvid,priviledge_table.description AS priv,childlen,childnum,childavail FROM xjos.user_priv_table JOIN xjos.priviledge_table ON user_priv_table.pvid=priviledge_table.pvid WHERE uid='+sqlc.escape(tuid),
		function(err,rows){
			pobj.privtable=rows;
			callback(err,sqlc,pobj);
		});
	},
	function(sqlc,pobj,cb){
		sqlc.query('SELECT priviledge_table.pvid,priviledge_table.description AS priv,childlen,childnum,childavail FROM xjos.user_priv_table JOIN xjos.priviledge_table ON user_priv_table.pvid=priviledge_table.pvid WHERE uid='+sqlc.escape(uid)+' AND childavail>0',
		function(err,rows){
			pobj.availpriv=rows;
			cb(err,pobj);
			sqlc.end();
		})
	},
	function(pobj,cb){
//		console.log(JSON.stringify(pobj));
		callback(JSON.stringify(pobj));
		cb();
	}],
	function(err){
		if(err)
			console.log('VIEW ERROR:'+err);
	});
}
function list(uid,data,sql,callback){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT uid,email AS em,username AS un,realname AS rn,nickname AS nn,rating AS rt,level AS ll FROM xjos.user',
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
			console.log(err);
	});
}
function edit(uid,data,sql,callback){
	var kobj={},zuid;
	try{
		var pobj=JSON.parse(data);
		if(pobj.order=='uid'||pobj.order=='username')return;
		kobj[pobj.order]=pobj.data;
		zuid=pobj.uid;
		if(isNaN(zuid))return;
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('UPDATE xjos.user SET '+sqlc.escape(kobj)+' AND uid='+sqlc.escape(zuid),
		function(err,rows){
			callback(err);
		});
	},
	function(cb){
		callback('ok');
		cb();
	}],
	function(err){
		if(err)
			console.log(err);
	});
}
function editself(uid,data,sql,callback){
	try{
		var tobj=JSON.parse(data);
		tobj.uid=uid;
		data=JSON.stringify(tobj);
	}catch(e){
		console.log(e);
		return;
	}
	edit(uid,data,sql,callback);
}
function editpriv(uid,data,sql,callback){
	var kobj={},zuid;
	try{
		var pobj=JSON.parse(data);
		kobj['pvid']=pobj.pvid;
		kobj['uid']=pobj.uid;
		kobj['cha']=pobj.childavail;
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT upid,childavail,childlen FROM xjos.user_priv_table WHERE uid='+sqlc.escape(uid)+' AND pvid='+sqlc.escape(kobj.pvid),function(err,rows){
			if(err){callback(err);return;}
			if(rows.length<1){callback('NoPriv');return}
			callback(err,sqlc,rows[0].childavail,rows[0].childlen,rows[0].upid);
		});
	},
	function(sqlc,childavail,cl,upid,callback){
		if(childavail==0){callback('NoPriv');return;}
		if(childavail<kobj.cha)kobj.cha=childavail;
		sqlc.query('UPDATE xjos.user_priv_table SET childavail='+sqlc.escape(childavail-1)+' WHERE uid='+sqlc.escape(uid)+' AND pvid='+sqlc.escape(kobj.pvid),
		function(err,rows){
			callback(err,sqlc,cl,upid);
		});
	},
	function(sqlc,cl,fa,callback){
		var iobj={'uid':kobj.uid,'pvid':kobj.pvid,'privfather':fa,'childlen':childlen-1,'childnum':0,'time':new Date(),'childavail':kobj.cha}
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(iobj),
		function(err,rows){
			callback(err);
		})
	},
	function(cb){
		callback('ok');
		cb();
	}],
	function(err){
		if(err)
			console.log(err);
	});
}
