var async=require('async'),
    libdb=require('./libdb');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(conn.uid==null)
		return;
	if(handle==='getcur'){
		getcur(conn.uid,data,sql,callback);
	}else if(handle==='touch'){
		touch(conn.uid,data,sql,callback);
	}else if(handle==='ls'){
		ls(conn.uid,data,sql,callback);
	}else if(handle==='cp'){
		cp(conn.uid,data,sql,callback);
	}else if(handle==='mv'){
		mv(conn.uid,data,sql,callback);
	}else if(handle==='rm'){
		rm(conn.uid,data,sql,callback);
	}else if(handle==='cd'){
		cd(conn.uid,data,sql,callback);
	}else if(handle==='pwd'){
		pwd(conn.uid,data,sql,callback);
	}else if(handle==='mkdir'){
		mkdir(conn.uid,data,sql,callback);
	}else if(handle==='getbase64'){
		getbase64(conn.uid,data,sql,callback);
	}else if(handle==='getplaintext'){
		getplaintext(conn.uid,data,sql,callback);
	}else if(handle==='postplaintext'){
		postplaintext(conn.uid,data,sql,callback);
	}else if(handle==='postbase64'){
		postbase64(conn.uid,data,sql,callback);
	}
}

var isprofiling=false;
function delprob(uid,data,sql,callback){
	var pobj;
	try{
		var p=JSON.parse(data);
		pobj={'cid':p.cid,'pid':p.pid};
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		libdb.iscidexist(pobj.cid,sql,callback);
	},
	function(isc,callback){
		libdb.ispidexist(pobj.pid,sql,function(err,isp){
			if((!isp)||(!isc))
				callback('DELPROB:CID OR PID NOT EXISTS');
			else
				callback(null);
		});
	},
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('DELETE FROM xjos.contest_problem WHERE cid='+sqlc.escape(pobj.cid)+' AND pid='+sqlc.escape(pobj.pid),
		function(err,rows){
			sqlc.end();
			callback(err);
		});
	}],
	function(err){
		if(err){
			console.log('Contest.DelProb:ERR:'+err);
			callback('fail');
		}else{
			callback('ok');
		}
	});
}

function addprob(uid,data,sql,callback){
	var pobj;
	try{
		var p=JSON.parse(data);
		pobj={'cid':p.cid,'pid':p.pid};
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		libdb.iscidexist(pobj.cid,sql,callback);
	},
	function(isc,callback){
		libdb.ispidexist(pobj.pid,sql,function(err,isp){
			if((!isp)||(!isc))
				callback('ADDPROB:CID OR PID NOT EXISTS');
			else
				callback(null);
		});
	},
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT MAX(contest_problem_rank) AS cr FROM xjos.contest_problem WHERE cid='+pobj.cid,
		function(err,rows){
			if(rows.length<1)callback('Error:Contest_AddProb CPR Not Exist')
			callback(err,rows[0].cr,sqlc);
		});
	},
	function(ct,sqlc,callback){
		pobj.contest_problem_rank=ct+1;
		if(data.rank!=undefined)
			pobj.contest_problem_rank=data.rank;
		sqlc.query('INSERT INTO xjos.contest_problem SET '+sqlc.escape(pobj),
		function(err,rows){
			sqlc.end()
			callback(err);
		});
	}],
	function(err){
		if(err){
			console.log('Contest.AddProb:ERR:'+err);
			callback('fail');
		}else{
			callback('ok');
		}
	});
}

function edit(uid,data,sql,callback){
	var pobj;
	var cid;
	try{
		var t=JSON.parse(data);
		if(t.order=='start_time'||t.order=='end_time'){
			t.data=new Date(t.data);
		}
		pobj={};
		pobj[t.order]=t.data;
		cid=t.cid;
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('UPDATE xjos.contest SET '+sqlc.escape(pobj)+' WHERE cid='+sqlc.escape(cid),
		function(err,rows){
			sqlc.end();
			callback(err);
		});
	}],
	function(err){
		if(err){
			console.log('Contest.Edit:ERR:'+err);
			callback('fail');
		}else
			callback('ok');
	});
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

function grade(uid,data,sql,callback){
	var cid;
	try{
		var inputobj=JSON.parse(data);
		cid=inputobj.cid;
	}catch(e){
		console.log('Contest.Grade:ERR:'+e);
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT contest.cid FROM xjos.user_contest JOIN xjos.contest ON user_contest.cid=contest.cid WHERE contest.cid='+sqlc.escape(cid)+' AND user_contest.uid='+sqlc.escape(uid)+' AND ((user_contest.start_time<NOW() AND user_contest.end_time>NOW() AND user_contest.type="virtual") OR (contest.start_time<NOW() AND contest.end_time>NOW() AND user_contest.type="real")) ',
		function(err,rows){
			if(err){
				callback(err)
				sqlc.end();
				return;
			}
			if(rows.length>0){
				callback('It\'s a processing contest');
				sqlc.end();
				return;
			}
			callback(err,sqlc);
		});
	},
	function(sqlc,callback){
		if(isprofiling)
			console.log('Contest.Grade.Prof.A:'+JSON.stringify(new Date()));
		sqlc.query('SELECT submit.pid,submit.uid,submit.sid,username,status,grade,problem_title FROM xjos.submit JOIN xjos.user ON user.uid=submit.uid JOIN xjos.problem ON submit.pid=problem.pid JOIN xjos.contest_submit ON contest_submit.sid=submit.sid WHERE islast=1 AND cid='+sqlc.escape(cid),
		function(err,rows){
			callback(err,rows);
			sqlc.end();
			if(isprofiling)
				console.log('Contest.Grade.Prof.B:'+JSON.stringify(new Date()));
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			console.log('Contest.Grade:ERR2'+err);
	});
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
		//obj.start_time=new Date((new Date(obj.start_time)).getTime()+8*3600*1000);
		obj.start_time=new Date(obj.start_time);
		obj.end_time=new Date(obj.end_time);
		var mkobk={'cid':obj.cid,'type':obj.type,'uid':uid,'start_time':obj.start_time,'end_time':obj.end_time,'reg_time':new Date()};
		async.waterfall([
		function(callback){
			sql.getConnection(callback);
		},
		function(sqlc,callback){
			sqlc.query('SELECT start_time,end_time FROM xjos.contest WHERE cid='+sqlc.escape(obj.cid),
			function(err,rows){
				if(err){
					callback(err);
					return;
				}
				if(rows.length==0){
					callback('Not exist');
					return;
				}
				callback(null,sqlc,rows[0]);
			});
		},
		function(sqlc,ctobj,callback){
			if(mkobk.type=='real'){
				mkobk.start_time=ctobj.start_time;
				mkobk.end_time=ctobj.end_time;
			}else if(mkobk.type!='virtual'){
				sqlc.end();
				console.log('RegContest:Contest Type Error');
				return;
			}
			sqlc.query('INSERT INTO xjos.user_contest SET '+sqlc.escape(mkobk),
			function(err,rows){
				callback(err);
				sqlc.end();
			});
		}],
		function(err){
			if(err){
				callback('err');
				console.log('Contest.Reg:ERR:'+err);
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
			if(isprofiling)
				console.log('Select Contest Start:'+JSON.stringify(new Date()));
			sqlc.query("SELECT cid,name,type,start_time,end_time,TIMEDIFF(end_time,start_time) AS length,((end_time<NOW()) + (start_time<NOW())) AS status,levelt AS level FROM xjos.contest ORDER BY start_time DESC",function(err,rows){
				sqlc.end();
				if(isprofiling)
					console.log('Select Contest Finished:'+JSON.stringify(new Date()));
				if(!err)
					callback(JSON.stringify(rows));
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
function info(uid,data,sql,callback){//S1
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
		sqlc.query('SELECT cid,name,type,start_time,end_time,TIMEDIFF(end_time,start_time) AS length,((end_time<NOW()) + (start_time<NOW())) AS status,levelt AS level FROM xjos.contest WHERE cid='+sqlc.escape(cid),
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
		sqlc.query("SELECT xjos.problem.pid,problem_title,levelt,elo,contest_problem_rank FROM xjos.contest_problem JOIN xjos.problem ON xjos.contest_problem.pid=xjos.problem.pid WHERE cid="+sqlc.escape(cid)+' ORDER BY contest_problem_rank ASC',
		function(err,rows){
			if(cobj['status']!=0){
				cb(err,sqlc,cobj,rows);
			}else{
				cb(err,sqlc,cobj,[]);
			}
		});
	},
	function(sqlc,cobj,probs,cb){
		sqlc.query('SELECT ucid,type,reg_time,start_time FROM xjos.user_contest WHERE uid='+sqlc.escape(uid)+' AND cid='+sqlc.escape(cid),
		function(err,rows){
			cb(err,sqlc,cobj,probs,rows);
		});
	},
	function(sqlc,cobj,probs,regs,cb){
		cobj.probs=probs;
		cobj.regs=regs;
		sqlc.query('SELECT pid,submit.sid,status,datetime,language,grade FROM xjos.contest_submit JOIN xjos.submit ON submit.sid=contest_submit.sid WHERE cid='+sqlc.escape(cid)+' AND uid='+sqlc.escape(uid),function(err,rows){
			if(err){
				sqlc.end();
				callback(err);
			}
			console.log(err);
			console.log(rows);
			var st=new Date(cobj.start_time),et=new Date(cobj.end_time),now=new Date();
			if(st<now&&et>now&&cobj.type=='OI'){
				for(var i=0;i<rows.length;i++){
					rows[i]['status']&=6;
					rows[i]['grade']=null;
				}
			}
			cobj.submits=rows;
			cb(null,cobj);
			sqlc.end();
		});
	},
	function(cobj,cb){
		callback(JSON.stringify(cobj));
		cb();
	}],
	function(err){
		if(err)
			console.log("ERR:STD-CONTEST-GETP:"+JSON.stringify(err));
	});
}

/*function listgrade(uid,data,sql,callback){
	var cid;
	console.log('LG');
	try{
		var k=JSON.parse(data);
		cid=parseInt(k.cid);
		if(isNaN(cid))callback('WA');
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('set profiling=1',function(err,rows){
			callback(err,sqlc);
		})
	},
	function(sqlc,callback){
		console.log('S:'+new Date());
		sqlc.query('SELECT submit.sid,cid,pid,uid,grade,status FROM xjos.contest_submit JOIN xjos.submit ON xjos.submit.sid=xjos.contest_submit.sid WHERE islast=1',function(err,rows){
			console.log('T:'+new Date());
			callback(err,sqlc);
		});
	},
	function(sqlc,callback){
		sqlc.query('SHOW PROFILE FOR QUERY 1',function(err,rows){
			callback(err,rows);
			sqlc.end();
		});
	},
	function(rows,cb){
		console.log(rows);
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			console.log('List Grade Err:'+err);
	});
}*/
function add(uid,data,sql,callback){
	var name,description,type,start_time,end_time,levelt;
	var retobj={'status':'err'}
	try{
		var tobj=JSON.parse(data);
		name=tobj.name;
		description=tobj.description;
		type=tobj.type;
		start_time=tobj.startTime;
		end_time=tobj.endTime;
		if(start_time==undefined){
			start_time=new Date();
			start_time.setHours(13);
			start_time.setMinutes(0);
			start_time.setSeconds(0);
			start_time.setMilliseconds(0);
		}else{
			start_time=new Date(start_time);
		}
		if(end_time==undefined){
			end_time=new Date();
			end_time.setHours(17);
			end_time.setMinutes(0);
			end_time.setSeconds(0);
			end_time.setMilliseconds(0);
		}else{
			end_time=new Date(end_time);
		}
		levelt=tobj.level;
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		var insobj={'name':name,'description':description,'start_time':start_time,'end_time':end_time,'levelt':levelt,'type':type,'old_info':''};
		sqlc.query('INSERT INTO xjos.contest SET '+sqlc.escape(insobj),
		function(err,rows){
			if(err){
				callback(err);
			}else{
				callback(err,rows.insertId);
			}
			sqlc.end();
		});
	},
	function(cid,cb){
		retobj['status']='ok';
		retobj.cid=cid;
		callback(JSON.stringify(retobj));
		cb();
	}],
	function(err){
		if(err){
			callback(JSON.stringify(retobj));
			console.log('Addcontest'+err);
		}
	});
}
function minfo(uid,data,sql,callback){//S1
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
		sqlc.query('SELECT cid,name,type,start_time,end_time,TIMEDIFF(end_time,start_time) AS length,((end_time<NOW()) + (start_time<NOW())) AS status,levelt AS level FROM xjos.contest WHERE cid='+sqlc.escape(cid),
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
		sqlc.query("SELECT xjos.problem.pid,problem_title,levelt,elo,contest_problem_rank FROM xjos.contest_problem JOIN xjos.problem ON xjos.contest_problem.pid=xjos.problem.pid WHERE cid="+sqlc.escape(cid)+' ORDER BY contest_problem_rank ASC',
		function(err,rows){
			cb(err,sqlc,cobj,rows);
		});
	},
	function(sqlc,cobj,probs,cb){
		sqlc.query('SELECT ucid,type,reg_time,start_time FROM xjos.user_contest WHERE cid='+sqlc.escape(cid),
		function(err,rows){
			cb(err,sqlc,cobj,probs,rows);
		});
	},
	function(sqlc,cobj,probs,regs,cb){
		cobj.probs=probs;
		cobj.regs=regs;
		sqlc.end();
		cb(null,cobj);
	},
	function(cobj,cb){
		callback(JSON.stringify(cobj));
		cb();
	}],
	function(err){
		if(err)
			console.log("ERR:STD-CONTEST-GETP:"+JSON.stringify(err));
	});
}
