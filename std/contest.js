var async=require('async');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(conn.uid==null){
		return;
	}
	if(handle==='list'){
		list(conn.uid,data,sql,callback);
	}else if(handle==='info'){
		info(conn.uid,data,sql,callback);
	}else if(handle==='regcontest'){
		regcontest(conn.uid,data,sql,callback);
	}else if(handle==='delete'){
		deletecontest(conn.uid,data,sql,callback);
	}
}

function deletecontest(uid,data,sql,callback){//S0
	try{
		if(isNaN(data)){
			callback('Not an apple');
			console.log('Delete Contest Error:D001');
			return;
		}
	}catch(e){
	}
}
function regcontest(uid,data,sql,callback){//S1
	if(uid==null){
		console.log('ERR:STD-CONTEST-REGC:Not Login');
		return;
	}
	try{
		var obj=JSON.parse(data);
		if(typeof(obj.cid)!='number'||typeof(obj.type)!='string'||typeof(obj.start_time)!='string'){
			console.log('ERR');
			return;
		}
		obj.start_time.setTime(obj.start_time.getTime()+8*3600*1000);
		var mkobk={'cid':obj.cid,'type':obj.type,'uid':uid,'start_time':obj.start_time,'reg_time':new Date()};
		async.waterfall([
		function(callback){
			sql.getConnection(callback);
		},
		function(sqlc,callback){
			sqlc.query('INSERT INTO xjos.user_contest SET '+sqlc.escape(mkobk),
			function(err,rows){
				callback(err);
				sqlc.end();
			});
		}],
		function(err){
			if(err){
				callback('err');
				console.log('Regcontest:'+err);
			}else{
				callback('ok');
			}
		});
	}catch(e){
		console.log(e);
	}
}

function list(uid,data,sql,callback){//S2
	if(uid==null){
		console.log("ERR:STD-CONTEST-LIST:Not Login");
		return;
	}
	if(data==='all'){
		async.waterfall([
		function(cb){
			sql.getConnection(cb);
		},
		function(sqlc,cb){
			sqlc.query("SELECT cid,name,type,start_time,end_time,TIMEDIFF(end_time,start_time) AS length,((end_time<NOW()) + (start_time<NOW())) AS status,ROUND(RAND()*10) AS level FROM xjos.contest ORDER BY start_time DESC",function(err,rows){
				if(!err)
					callback(JSON.stringify(rows));
				sqlc.end();
				cb(err);
			});
		}],
		function(err){
			if(err)
				console.log("ERR:STD-CONTEST-LIST-ALL:"+err);
		});
	}else{
		var dataobj;
		try{
			dataobj=JSON.parse(data);
			if(dataobj.type==undefined){
				console.log("ERR:STD-CONTEST-LIST-OBJ:"+data);
				return;
			}
		}catch(e){
			console.log("ERR:STD-CONTEST:"+data);
		}
		if(dataobj.type=='title'){
			if(dataobj.title==undefined){
				console.log("ERR:STD-CONTEST-LIST-OBJ:"+data);
				return;
			}
			async.waterfall([
			function(cb){
				sql.getConnection(cb);
			},
			function(sqlc,cb){
				sqlc.query("SELECT * FROM xjos.contest WHERE title LIKE %"+sqlc.escape(dataobj.title)+"%",
				function(err,rows){
					if(!err)
						callback(JSON.stringify(rows));
					sqlc.end();
					cb(err);
				});
			}],
			function(err){
				if(err)
					console.log("ERR:STD-CONTEST-LIST-TITLE:"+err);
			});
		}else if(dataobj.type=='date'){
			if(dataobj.start==undefined||dataobj.end==undefined){
				console.log("ERR:STD-CONTEST-LIST-OBJ:"+data);
				return;
			}
			async.waterfall([
			function(cb){
				sql.getConnection(cb);
			},
			function(sqlc,cb){
				sqlc.query("SELECT * FROM xjos.contest WHERE starttime>"+sqlc.escape(dataobj.start)+" AND starttime<"+sqlc.escape(dataobj.end),
				function(err,rows){
					if(!err)
						callback(JSON.stringify(rows));
					sqlc.end()
					cb(err);
				});
			}],
			function(err){
				if(err)
					console.log("ERR:STD-CONTEST-LIST-DATE:"+err);
			});
		}
	}
}
function info(uid,data,sql,callback){//S2
	if(uid==null){
		console.log("ERR:STD-CONTEST-GETP:Not Login");
		return;
	}
	var cid=parseInt(data);
	if(cid==NaN){
		console.log("ERR:STD-CONTEST-GETP:cid:"+data);
		return;
	}
	async.waterfall([
	function(cb){
		sql.getConnection(cb);
	},
	function(sqlc,cb){
		sqlc.query('SELECT cid,name,type,start_time,end_time,TIMEDIFF(end_time,start_time) AS length,((end_time<NOW()) + (start_time<NOW())) AS status,ROUND(RAND()*10) AS level FROM xjos.contest WHERE cid='+sqlc.escape(cid),
		function(err,rows){
			if(rows.length>0)
				cb(err,sqlc,rows[0]);
			else{
				cb('NoContest')
				sqlc.end();
			}
		});
	},
	function(sqlc,cobj,cb){
		sqlc.query("SELECT xjos.problem.pid,problem_title,levelt,elo,contest_problem_rank FROM xjos.problem INNER JOIN xjos.contest_problem ON xjos.contest_problem.pid=xjos.problem.pid WHERE cid="+sqlc.escape(cid)+' ORDER BY contest_problem_rank ASC',
		function(err,rows){
			if(cobj['status']!=0){
				cb(err,sqlc,cobj,rows);
			}else{
				cb(err,sqlc,cobj,null);
			}
		});
	},
	function(sqlc,cobj,probs,cb){
		sqlc.query('SELECT ucid,type,reg_time,start_time FROM xjos.user_contest WHERE uid='+sqlc.escape(uid)+' AND cid='+sqlc.escape(cid),
		function(err,rows){
			cb(err,cobj,probs,rows);
			sqlc.end();
		});
	},
	function(cobj,probs,regs,cb){
		cobj.probs=probs;
		cobj.regs=regs;
		callback(JSON.stringify(cobj));
		cb();
	}],
	function(err){
		if(err)
			console.log("ERR:STD-CONTEST-GETP:"+err);
	});
}
