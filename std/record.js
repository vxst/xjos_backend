var notjson=require('./libjson');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	isok(conn.uid,'record',sql,function(ct){
		if(ct==0)return;
		if(handle==='recordlist'){
			recordlist(conn.uid,data,sql,callback);
		}else if(handle==='info'){
			recordinfo(conn.uid,data,sql,callback);
		}
	});
}
function recordlist(uid,data,sql,callback){
/*	var q=notjson.parse(data);
	if(typeof(q)!='object'){
		callback('Json error');
		return;
	}
	if(typeof(q.pid)!='number'||typeof(q.language!='number')||typeof(q.source!='string')){
		callback('Json error');
		return;
	}
	for(k in q){
		if(k!='pid'&&k!='language'&&k!='source'){
			callback('SUI');
			return;
		}
	}*/
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	sql.getConnection(function(err,sqlconn){
		sqlconn.query('SELECT sid,pid,datetime,language,status,grade FROM xjos.submit WHERE uid='+sqlconn.escape(uid),function(err,rows){
			callback(JSON.stringify(rows));
			sqlconn.end();
		});
	});
}
function recordinfo(uid,data,sql,callback){
	var sid=parseInt(data);
	if(sid==NaN)
		return;
	sql.getConnection(function(err,sqlconn){
		sqlconn.query('SELECT * FROM xjos.submit WHERE sid=? AND uid=?',[sid,uid],function(err,rows){
			if(rows.length==0){
				callback("XJ_NOT_FOUND_ERROR");
			}else{
				callback(rows[0]);
			}
			sqlconn.end();
		});
	});
}
