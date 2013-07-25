var isok=require('../lib/isok').isok;
var async=require('async');
var xjsec=require('./libcrypt');

exports.main=function(conn,handle,data,sql,callback){
	if(isNaN(conn.uid))return;
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
		if(handle==='grantpriv'){
			editpriv(conn.uid,data,sql,callback);
		}else
		if(handle==='deletepriv'){
			deletepriv(conn.uid,data,sql,callback);
		}
	});
	if(handle==='editself'){
		editself(conn.uid,data,sql,callback);
	}else if(handle==='editpassword'){
		editpassword(conn.uid,data,sql,callback);
	}
}
function editpassword(uid,data,sql,callback){
	var oldpw,newpw;
	try{
		var tobj=JSON.parse(data);
		oldpw=tobj.oldPassword;
		newpw=tobj.newPassword;
		if(oldpw.length!=32)return;
		if(newpw.length!=32)return;
	}catch(e){
		console.log('ERREditPassword:'+e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT password,password_salt FROM xjos.user WHERE uid='+sqlc.escape(uid),
		function(err,rows){
			if(err){
				sqlc.end();
				callback(err);
			}else if(rows.length<1){
				sqlc.end();
				callback('XJOS under ATTACK:Trying to change password for a unexist user!');
			}else
				callback(err,rows[0],sqlc);
		});
	},
	function(pwobj,sqlc,cb){
		xjsec.verifykey(oldpw,pwobj.password_salt,function(dk){
			if(dk==pwobj.password){
				cb(null,sqlc);
			}else{
				sqlc.end();
				callback('Password Wrong');
				cb('Password Wrong UID:'+uid);
			}
		});
	},
	function(sqlc,cb){
		xjsec.genkey(newpw,
		function(salt,dk){
			cb(null,sqlc,dk,salt);
		});
	},
	function(sqlc,password,password_salt,cb){
		sqlc.query('UPDATE xjos.user SET password='+sqlc.escape(password)+', password_salt='+sqlc.escape(password_salt)+' WHERE uid='+sqlc.escape(uid),function(err,rows){
			cb(err);
			sqlc.end();
		})
	},
	function(cb){
		callback('ok');
	}],
	function(err){
		if(err)
			console.log(err);
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
	var tuid=parseInt(data);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query("SELECT uid,username as un,email as em,realname as rn,nickname as nn,birthday as bd,gold,silver,level,rating,priv FROM xjos.user WHERE uid="+sqlc.escape(tuid),
		function(err,rows){
			if(err){
				sqlc.end();
				console.log(err);
				return;
				callback(err);
			}else if(rows.length>0){
				callback(err,sqlc,rows[0]);
			}else{
				sqlc.end();
				callback('No such user:UID:'+uid);
			}
		});
	},
	function(sqlc,pobj,callback){
		sqlc.query('SELECT priviledge_table.pvid,priviledge_table.description AS priv,childlen,childnum,childavail FROM xjos.user_priv_table JOIN xjos.priviledge_table ON user_priv_table.pvid=priviledge_table.pvid WHERE uid='+sqlc.escape(tuid),
		function(err,rows){
			pobj.privtable=rows;
			if(err){
				sqlc.end();
				callback(err);
				return;
			}
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
		sqlc.query('UPDATE xjos.user SET '+sqlc.escape(kobj)+' WHERE uid='+sqlc.escape(zuid),
		function(err,rows){
			callback(err);
			sqlc.end();
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
		if(pobj.childavail==undefined)pobj.childavail=0;
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
		var iobj={'uid':kobj.uid,'pvid':kobj.pvid,'privfather':fa,'childlen':cl-1,'childnum':0,'time':new Date(),'childavail':kobj.cha}
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(iobj),
		function(err,rows){
			callback(err);
			sqlc.end();
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
function deletepriv(uid,data,sql,callback){//FIXME:Not Look like good
	var kobj={},zuid;
	try{
		var pobj=JSON.parse(data);
		kobj['pvid']=pobj.pvid;
		kobj['uid']=pobj.uid;
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
		sqlc.query('UPDATE xjos.user_priv_table SET childavail='+sqlc.escape(childavail+1)+' WHERE uid='+sqlc.escape(uid)+' AND pvid='+sqlc.escape(kobj.pvid),
		function(err,rows){
			callback(err,sqlc,cl,upid);
		});
	},
	function(sqlc,cl,fa,callback){
		sqlc.query('SELECT upid FROM xjos.user_priv_table WHERE uid='+sqlc.escape(kobj.uid)+' AND pvid='+sqlc.escape(kobj.pvid),function(err,rows){
			if(err){callback(err);return;}
			if(rows.length<1){callback('NoSuchPriv');return}
			var upid=rows[0].upid;
			var killchildren=function(sqlc,upid,callback){
				async.waterfall([
				function(callback){
					sqlc.query('SELECT upid FROM xjos.user_priv_table WHERE privfather='+sqlc.escape(upid),
					function(err,rows){
						callback(err,rows);
					});
				},
				function(mkrows,callback){
					async.eachSeries(mkrows,
					function(upidobj,callback){
						killchildren(sqlc,upidobj.upid,callback);
					},
					function(err){
						callback(err);
					});
				},
				function(callback){
					sqlc.query('DELETE FROM xjos.user_priv_table WHERE privfather='+sqlc.escape(upid),
					function(err,rows){
						callback(err);
					});
				}],
				function(err){
					if(err)
						console.log(err);
					callback(err,sqlc);
				});
			};
			killchildren(sqlc,upid,callback);
		});
	},
	function(sqlc,callback){
		sqlc.query('DELETE FROM xjos.user_priv_table WHERE uid='+sqlc.escape(kobj.uid)+' AND pvid='+sqlc.escape(kobj.pvid),
		function(err,rows){
			callback(err);
			sqlc.end();
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
