var async=require('async'),
    isok=require('../lib/isok').isok,
    libuser=require('./libuser'),
    srvlog=require('../lib/log').srvlog;
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	isok(conn.uid,'view_problem',sql,
	function(ct){
		if(ct==0){
			return;
		}
		if(handle==='search'){
			search(conn.uid,data,sql,callback);
		}else if(handle==='recommend'){
			recommend(conn.uid,data,sql,callback);
		}else if(handle==='levelt'){
			getlevel(conn.uid,data,sql,callback);
		}else if(handle==='all'){
			all(conn.uid,data,sql,callback);
		}
	});
}

function fakerows(rows){
	for(var i=0;i<rows.length;i++){
		var tot=null;
		if(Math.random()>0.2){
			tot=100;
		}else if(Math.random()>0.5){
			tot=200;
		}else{
			tot=150;
		}
		var tle=Math.random()*0.15,mle=Math.random()*0.15;
		var re=Math.random()*0.15;
		var wa=Math.random()*0.15;
		var spje=Math.random()*0.1;
		var blank=Math.random()*0.1;
		if(Math.random()<0.2){
			blank=1;
			re=mle=tle=wa=spje=0;
		}else if(Math.random()>0.01){
			blank=0;
		}
		if(Math.random()>0.2)
			spje=0;
		if(Math.random()>0.2)
			re=0;
		if(Math.random()>0.2)
			tle=0;
		if(Math.random()>0.2)
			mle=0;
		if(Math.random()>0.2)
			wa=0;
		rows[i].re=Math.floor(re*tot);
		rows[i].mle=Math.floor(mle*tot);
		rows[i].tle=Math.floor(tle*tot);
		rows[i].wa=Math.floor(wa*tot);
		rows[i].spje=Math.floor(spje*tot);
		rows[i].blank=Math.floor(blank*tot);
		rows[i].ac=tot-rows[i].re-rows[i].mle-rows[i].tle-rows[i].wa-rows[i].spje-rows[i].blank;
	}
}
function all(uid,data,sql,callback){
	sql.getConnection(function(err,sqlconn){
		sqlconn.query("SELECT pid,problem_title,elo,levelt FROM xjos.problem",function(err,rows){
			callback(JSON.stringify(rows));
			sqlconn.end();
		});
	});
}
function recommend(uid,data,sql,callback){
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	sql.getConnection(function(err,sqlconn){
		sqlconn.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem",function(err,rows){
			fakerows(rows);
			callback(JSON.stringify(rows));
			sqlconn.end();
		});
	});
}
function getlevel(uid,data,sql,callback){
	//console.log("G_A");
	if(isNaN(data))return;
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	var k=parseInt(data);
	async.waterfall([
	function(callback){
		libuser.getlevel(uid,sql,function(lvl){
			callback(null,lvl);
		});
	},
	function(level,callback){
		if(level<k)
			callback('Want a problem level higher than user\'s');
		else
			sql.getConnection(callback);
	},
	function(sqlc,cb){
		sqlc.query('SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE problem_title!="" AND levelt='+sqlc.escape(k),
		function(err,rows){
//			fakerows(rows);
			callback(JSON.stringify(rows));
			sqlc.end();
			cb();
		});
	}],
	function(err){
		if(err)
			srvlog('B','problemindex.getlevel:'+data+' Error:'+err+' UID:'+uid);
	});
}
function search(uid,data,sql,callback){
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	var keyobj=null;
	try{
		keyobj=JSON.parse(data);
	}catch(e){
		callback('JSON_CHECK_FAILED');
		return;
	}
	if(keyobj.keyword===undefined||keyobj.start===undefined||keyobj.length===undefined){
		callback('OBJECT_CHECK_FAILED');
		return;
	}
	async.waterfall([
	function(callback){
		libuser.getlevel(uid,sql,
		function(lvl){
			callback(null,lvl);
		});
	},
	function(level,callback){
		sql.getConnection(function(err,sqlc){callback(err,sqlc,level)});
	},
	function(sqlc,level,callback){
		var data=keyobj.keyword;
		if(data.length>0){
			var querystr="SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE ("
			for(var i=0;i<data.length;i++){
				querystr+=" pid="+sqlc.escape(data[i])+" OR ";
			}
			for(var i=0;i<data.length;i++){
				querystr+=' LOWER(problem_title) LIKE CONCAT("%",LOWER('+sqlc.escape(data[i])+'),"%") OR ';
			}
			for(var i=0;i<data.length;i++){
				querystr+=' LOWER(problem_description) LIKE CONCAT("%",LOWER('+sqlc.escape(data[i])+'),"%") ';
				if(i!=data.length-1)
					querystr+=' OR ';
			}
			querystr+=') AND levelt<='+sqlc.escape(level);

			sqlc.query(querystr,function(err,rows){
				sqlc.end();
				callback(err,rows);
			});
		}else{
			sqlc.query('SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE levelt<='+sqlc.escape(level),
			function(err,rows){
				sqlc.end();
				callback(err,rows)
			});
		}
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
	}],
	function(err){
		if(err)
			console.log('Problemindex.Search:ERR:'+err);
	});
/*	sql.getConnection(function(err,sqlconn){
		if(data.length>0){
			sqlconn.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE pid ="+sqlconn.escape(data)+" OR LOWER(problem_title) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR LOWER(problem_description) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR pid IN (SELECT problem_group_tag.pid FROM xjos.problem_group_tag WHERE problem_group_id IN(SELECT problem_group_id FROM xjos.problem_group WHERE LOWER(problem_group_content)=LOWER("+sqlconn.escape(data)+")))"+"LIMIT "+sqlconn.escape(keyobj.start)+","+sqlconn.escape(keyobj.length),
			function(err,rows){
				fakerows(rows);
				callback(JSON.stringify(rows));
				sqlconn.end();
			});
		}else{
			sqlconn.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem LIMIT "+sqlconn.escape(keyobj.start)+","+sqlconn.escape(keyobj.length),
			function(err,rows){
				fakerows(rows);
				callback(JSON.stringify(rows));
				sqlconn.end();
			});
		}
	});*/
}
