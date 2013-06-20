var async=require('async'),
    isok=require('../lib/isok').isok;
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	isok(conn.uid,'edit_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='addtag'){
			addtag(conn.uid,data,sql,callback);
		}else if(handle==='deltag'){
			deltag(conn.uid,data,sql,callback);
		}
	});
	isok(conn.uid,'view_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='gettaglist'){
			gettaglist(conn.uid,data,sql,callback);
		}else if(handle==='tagproblem'){
			tagproblem(conn.uid,data,sql,callback);
		}else if(handle==='muilttagproblem'){
			muilttagproblem(conn.uid,data,sql,callback);
		}else if(handle==='listtags'){
			listtags(conn.uid,data,sql,callback);
		}
	});
}

function gettaglist(uid,data,sql,callback){
	async.waterfall([
	function(cb){
		sql.getConnection(function(err,sqlc){
			cb(err,sqlc);
		});
	},
	function(sqlc,cb){
		sqlc.query("SELECT * FROM xjos.problem_ktag",function(err,rows){cb(err,rows);sqlc.end()});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
	}],
	function(err){
		if(err){
			callback("ERROR:UNKNOW ERROR:1T2FWGJ");
		}
	});
}
function addtag(uid,data,sql,callback){
	var d;
	try{
		d=JSON.parse(data);
		for(k in d){
			if(k!='pid'&&k!='ptid'){
				callback("JSON OBJ ERROR");
			}
		}
	}catch(e){
		callback("ERROR:UNKNOW ERROR:O52F5G7");
		return;
	}
	async.waterfall([
	function(cb){
		sql.getConnection(function(err,sqlc){
			cb(err,sqlc);
		});
	},
	function(sqlc,cb){
		sqlc.query("INSERT INTO xjos.problem_ktag_map SET ?",d,function(err,res){if(err){callback('fail');}else{callback('ok');}sqlc.end()});
	}],
	function(err){});
}
function deltag(uid,data,sql,callback){
	var d;
	try{
		d=JSON.parse(data);
		for(k in d){
			if(k!='pid'&&k!='ptid'){
				callback("JSON OBJ ERROR");
			}
		}
	}catch(e){
		callback("ERROR:UNKNOW ERROR:O52F5G7");
		return;
	}
	async.waterfall([
	function(cb){
		sql.getConnection(function(err,sqlc){
			cb(err,sqlc);
		});
	},
	function(sqlc,cb){
		sqlc.query("DELETE FROM xjos.problem_ktag_map WHERE pid="+sqlc.escape(d.pid)+" AND ptid="+sqlc.escape(d.ptid),d,function(err,res){if(err){callback('fail');console.log(err);}else{callback('ok');}sqlc.end()});
	}],
	function(err){});
}
function listtags(uid,data,sql,callback){
	var d=parseInt(data);
	if(d==NaN){
		callback('fail');
		return;
	}
	sql.getConnection(function(err,sqlc){
		if(!err){
			sqlc.query("SELECT ptid FROM xjos.problem_ktag_map WHERE pid="+sqlc.escape(d),function(err,rows){
				if(err){
					callback('fail');
				}else{
					callback(JSON.stringify(rows));
				}
				sqlc.end();
			});
		}
	});
}
function tagproblem(uid,data,sql,callback){
	var d=parseInt(data);
	if(d==NaN){
		callback('fail');
		return;
	}
	sql.getConnection(function(err,sqlc){
		if(!err){
			sqlc.query("SELECT pid FROM xjos.problem_ktag_map WHERE ptid="+sqlc.escape(d),function(err,rows){
				if(err){
					callback('fail');
				}else{
					callback(JSON.stringify(rows));
				}
				sqlc.end();
			});
		}
	});
}
function muilttagproblem(uid,data,sql,callback){
	var d;
	try{
		d=JSON.parse(data);
		if(d.length==0)return;
	}catch(e){
		callback("ERROR:UNKNOW ERROR:Q51K5R7");
		return;
	}
	sql.getConnection(function(err,sqlc){
		if(!err){
			var s="SELECT pid FROM xjos.problem_ktag_map GROUP BY pid HAVING ";
			for(var i=0;i<d.length;i++){
				s+=' ptid='+sqlc.escape(d[i]);
				if(i!=d.length-1){
					s+=' OR ';
				}
			}
			s+='AND count(*)='+sqlc.escape(d.length);


			sqlc.query(s,function(err,rows){
				if(err){
					callback('fail');
				}else{
					callback(JSON.stringify(rows));
				}
				sqlc.end();
			});
		}
	});
}
