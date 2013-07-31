var notjson=require('./libjson');
var elopvp=require('./libelo').personvsproblem;
var async=require('async');
var xmlparser=require('xml2js').parseString;
var isok=require('../lib/isok').isok;
var srvlog=require('../lib/log').srvlog;
var libuser=require('./libuser');

exports.main=function(conn,handle,data,sql,callback,eventbus){//if over 10,use array.
	isok(conn.uid,'submit_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='submit'){
			submit(conn.uid,data,sql,callback,eventbus);
		}
	});
	isok(conn.uid,'view_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='list'){
			list(conn.uid,data,sql,callback);
		}else if(handle==='listwpid'){
			listwpid(conn.uid,data,sql,callback);
		}else if(handle==='single'){
			getinfo(conn.uid,data,sql,callback);
		}else if(handle==='muiltiply'){
			muiltiply(conn.uid,data,sql,callback);
		}else if(handle==='gettjdainfolist'){
			gettjdainfo_list(conn.uid,data,sql,callback);
		}else if(handle==='gettjdainfostgid'){
			gettjdainfo_stgid(conn.uid,data,sql,callback);
		}else if(handle==='gettjdainfo'){
			gettjdainfo(conn.uid,data,sql,callback);
		}else if(handle==='getlanguage'){
			getlanguage(conn.uid,data,sql,callback);
		}else if(handle==='paySingleInfo'){
			paySingleInfo(conn.uid,data,sql,callback);
		}
	});
}
function getlanguage(uid,data,sql,callback){
	if(data!='all'){callback(JSON.stringify([]));return;}
	sql.getConnection(function(err,sqlc){
		sqlc.query('SELECT id,name,isshow FROM xjos.language',function(err,rows){
			if(err){
				callback('ERROR')
				srvlog('A','GetLanguageSQLError');
			}else{
				callback(JSON.stringify(rows));
			}
			sqlc.end();
		});
	});
}
function findcontest(uid,pid,sql,callback){//S1
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT user_contest.cid,contest.type,user_contest.type AS uctype FROM xjos.user_contest JOIN xjos.contest_problem ON contest_problem.cid=user_contest.cid JOIN xjos.contest ON contest.cid=user_contest.cid WHERE contest_problem.pid='+sqlc.escape(pid)+' AND user_contest.uid='+sqlc.escape(uid)+' AND ((user_contest.start_time<NOW() AND user_contest.end_time>NOW() AND user_contest.type="virtual")OR(contest.start_time<NOW() AND contest.end_time>NOW() AND user_contest.type="real")) ',
		function(err,rows){
//			console.log('FindContest:'+JSON.stringify(rows));
			callback(err,rows);
			sqlc.end();
		});
	}],
	function(err,rows){
		if(err){
			callback(null);
			console.log('Find Contest:'+err);
		}else{
			callback(rows);
		}
	});
}
function destatus(rows){//S2
	for(var i=0;i<rows.length;i++){
		rows[i]['status']=(rows[i]['status']|4096)^4096;
	}
}
function listwpid(uid,data,sql,callback){//S0
	if(isNaN(parseInt(data)))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT sid,xjos.problem.pid,problem_title,language,datetime,status,grade,ptype FROM xjos.submit INNER JOIN xjos.problem ON xjos.problem.pid=xjos.submit.pid WHERE uid='+sqlc.escape(uid)+' AND submit.pid='+sqlc.escape(parseInt(data))+' ORDER BY sid ASC',
		function(err,rows){
			if(err){
				console.log('ERR:STD-SUBMIT-LIST:'+err);
				sqlc.end();
				callback(err);
			}else{
				destatus(rows);
				callback(null,rows,sqlc);
			}
		});
	},
	function(rowstatus,sqlc,cb){
		sqlc.query('SELECT sid FROM xjos.contest_submit JOIN xjos.user_contest ON user_contest.cid=contest_submit.cid JOIN xjos.contest ON contest.cid=contest_submit.cid WHERE uid='+sqlc.escape(uid)+' AND ((user_contest.start_time<NOW() AND user_contest.end_time>NOW() AND user_contest.type="virtual") OR (contest.start_time<NOW() AND contest.end_time>NOW() AND user_contest.type="real")) ORDER BY sid ASC',
		function(err,rows){
			cb(err,rows,rowstatus);
			sqlc.end();
		});
	},
	function(sidarr,sbmarr,cb){
		//console.log(sidarr);
		for(var i=0,j=0;i<sbmarr.length&&j<sidarr.length;i++){
			while(j<sidarr.length&&sbmarr[i].sid>sidarr[j].sid)
				j++;
			if(j==sidarr.length)break;
			if(sbmarr[i].sid==sidarr[j].sid){
				sbmarr[i]['grade']=null;
				sbmarr[i]['status']&=6;
			}
		}
		callback(JSON.stringify(sbmarr));
		cb();
	}],
	function(err){
		if(err)
			console.log('ERR:STD-SUBMIT-LIST:'+err);
	});
}
function list(uid,data,sql,callback){//S1
	if(data!='all')return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT sid,xjos.problem.pid,problem_title,language,datetime,status,grade,ptype FROM xjos.submit JOIN xjos.problem ON xjos.problem.pid=xjos.submit.pid WHERE uid='+sqlc.escape(uid)+' ORDER BY sid ASC',
		function(err,rows){
			if(err){
				console.log('ERR:STD-SUBMIT-LIST:'+err);
				sqlc.end();
				callback(err);
			}else{
				destatus(rows);
				callback(null,rows,sqlc);
			}
		});
	},
	function(rowstatus,sqlc,cb){
		sqlc.query('SELECT sid FROM xjos.contest_submit JOIN xjos.user_contest ON user_contest.cid=contest_submit.cid JOIN xjos.contest ON contest.cid=contest_submit.cid WHERE uid='+sqlc.escape(uid)+' AND ((user_contest.start_time<NOW() AND user_contest.end_time>NOW() AND user_contest.type="virtual") OR (contest.start_time<NOW() AND contest.end_time>NOW() AND user_contest.type="real")) ORDER BY sid ASC',
		function(err,rows){
			cb(err,rows,rowstatus);
			sqlc.end();
		});
	},
	function(sidarr,sbmarr,cb){
		//console.log(sidarr);
		for(var i=0,j=0;i<sbmarr.length&&j<sidarr.length;i++){
			while(j<sidarr.length&&sbmarr[i].sid>sidarr[j].sid)
				j++;
			if(j==sidarr.length)break;
			if(sbmarr[i].sid==sidarr[j].sid){
				sbmarr[i]['grade']=null;
				sbmarr[i]['status']&=6;
			}
		}
		callback(JSON.stringify(sbmarr));
		cb();
	}],
	function(err){
		if(err)
			console.log('ERR:STD-SUBMIT-LIST:'+err);
	});
}
function getinfo(uid,data,sql,callback){
	if(uid==null){
		console.log('Unlogin agian');
		callback('Not login');
		return;
	}
	if(isNaN(data))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,cb){
		sqlc.query('SELECT problem.problem_title,submit.* FROM xjos.submit JOIN xjos.problem ON xjos.problem.pid=xjos.submit.pid WHERE sid='+sqlc.escape(data)+' AND uid='+sqlc.escape(uid)+' AND (submit.pid NOT IN (SELECT contest_problem.pid FROM xjos.contest JOIN xjos.user_contest ON contest.cid=user_contest.cid JOIN xjos.contest_problem ON contest_problem.cid=contest.cid WHERE contest.start_time<'+sqlc.escape(new Date())+' AND contest.end_time>'+sqlc.escape(new Date())+' AND uid='+sqlc.escape(uid)+') OR submit.sid IN (SELECT sid FROM xjos.contest_submit JOIN xjos.contest ON contest.cid=contest_submit.cid WHERE contest_submit.sid='+sqlc.escape(data)+' AND contest.start_time<'+sqlc.escape(new Date())+' AND contest.end_time>'+sqlc.escape(new Date())+')) ',
		function(err,rows){
			if(err){
				sqlc.end();
				callback('System Error');
				cb(err);
			}else if(rows.length<1){
				sqlc.end();
				callback(JSON.stringify({'err':'no result'}));
				cb('No result');
			}else{
				destatus(rows);
				var cuteobj=rows[0];
				if(cuteobj.result.length>0){
					xmlparser(cuteobj.result,{explicitArray:false},
					function(err,res){
						cuteobj.result=res.res.point;
						cb(null,sqlc,cuteobj);
					});
				}else{
					cb(null,sqlc,cuteobj);
				}
			}
		});
	},
	function(sqlc,cuteobj,cb){
		sqlc.query('SELECT sid FROM xjos.contest JOIN xjos.contest_submit ON contest_submit.cid=contest.cid JOIN xjos.user_contest ON contest.cid=user_contest.cid WHERE uid='+sqlc.escape(uid)+' AND ((user_contest.start_time<'+sqlc.escape(new Date())+' AND user_contest.end_time>'+sqlc.escape(new Date())+' AND user_contest.type="virtual") OR (contest.start_time<'+sqlc.escape(new Date())+' AND contest.end_time>'+sqlc.escape(new Date())+' AND user_contest.type="real")) ORDER BY sid ASC',
		function(err,rows){
			if(err){
				console.log(err);
				cb(err);
				return;
			}
			cuteobj.isincontest=false;
			for(var i=0;i<rows.length;i++)
				if(rows[i].sid==data)
					cuteobj.isincontest=true;
			cb(null,cuteobj,sqlc);
		});
	},
	function(cuteobj,sqlc,cb){
		if(cuteobj.ptype=='TJDA'&&cuteobj.isincontest==false){
			sqlc.query('SELECT problem_data_rank AS id,"0.00" AS mem,"0.00" AS time,sttbl.status,sttbl.status_id,CONV(sttbl.grade,10,10) AS score,sttbl.message FROM xjos.problem_data LEFT JOIN (SELECT stid,rank,grade,message,pid,status_id,status FROM xjos.submit_tjda WHERE sid='+sqlc.escape(data)+' AND uid='+sqlc.escape(uid)+') AS sttbl ON sttbl.rank=problem_data.problem_data_rank AND sttbl.pid=problem_data.pid WHERE xjos.problem_data.pid='+sqlc.escape(cuteobj.pid),function(err,rows){
				if(err){
					cb(err,rows);
					sqlc.end();
				}else{
					cuteobj.result=rows;
					cb(err,cuteobj,sqlc);
				}
			});
		}else{
			cb(null,cuteobj,sqlc);
		}
	},
	function(cuteobj,sqlc,callback){
		sqlc.query('SELECT problem_data_id,problem_data_method,problem_data_score,problem_data_time,problem_data_memory,problem_data_rank,tester FROM xjos.problem_data WHERE pid='+sqlc.escape(cuteobj.pid),
		function(err,rows){
			if(err){
				callback(err);
				return;
			}
			cuteobj.datalist=rows;
			callback(null,cuteobj);
			sqlc.end();
		});
	},
	function(cuteobj,cb){
		if(cuteobj.isincontest){
			cuteobj.datalist=[];
			cuteobj['status']&=6;
			cuteobj['running']=cuteobj['grade']=null;
			cuteobj['result']={};
		}
		callback(JSON.stringify(cuteobj));
		cb();
	}],
	function(err){
		if(err)
			console.log('ERR:STD-SUBMIT-SINGLE:'+err);
	});
}
function submit(uid,data,sql,callback,eventbus){//S2
	var q=notjson.parse(data);
	q.pid=parseInt(q.pid);
	q.language=parseInt(q.language);

	if(typeof(q.pid)!='number'||typeof(q.language)!='number'||typeof(q.source)!='string'){
		console.log('Submit Json errorB');
		return;
	}
	var subobj={'pid':q.pid,'language':q.language,'source':q.source,'datetime':new Date(),'uid':uid,'ptype':'NORMAL'};

	async.waterfall([
	function(callback){
		libuser.getlevel(uid,sql,function(lvl){
			if(isNaN(lvl)){
				srvlog('A','Get Level Error');
				callback('Get Level Error');
				return;
			}
			callback(null,lvl);
		})
	},
	function(lvl,callback){
		sql.getConnection(function(err,sqlconn){
			callback(err,sqlconn,lvl);
		});
	},
	function(sqlc,level,callback){
		sqlc.query('SELECT istjda FROM xjos.problem WHERE pid='+sqlc.escape(subobj.pid)+' AND levelt<'+sqlc.escape(level),function(err,rows){
			if(err){
				srvlog('A','SubmitSQLERR:'+err);
	console.log('Hehe');
				sqlc.end();
				callback('SQLErr');
				return;
			}
			if(rows.length<1){
				srvlog('B','No such prob');
	console.log('Hehe');
				callback('No Such Prob');
				return;
			}
			if(rows[0].istjda==1){
				srvlog('B','Submit ON TJDA By Normal');
	console.log('Hehe');
				callback('Type Error');
				return;
			}
			callback(err,sqlc);
		});
	},
	function(sqlc,callback){
		var c=findcontest(uid,q.pid,sql,function(ret){
			if(ret==null){
				srvlog('A','Find Contest Mod Error');
				callback('Submit ERR:Find Contest Module Error');
				sqlc.end();
			}else
				callback(null,ret,sqlc);
		});
	},
	function(cidarr,sqlc,callback){
		sqlc.query('INSERT INTO xjos.submit SET ?',subobj,function(err,res){
			if(err){
				sqlc.end();
				callback('Submit SQL Insert Fail');
			}else{
				srvlog('D','Submit from uid:'+uid+' Inserted. SID:'+res.insertId);
				callback(err,cidarr,sqlc,res.insertId);
			}
		});
	},
	function(cidarr,sqlc,id,callback){
		async.eachSeries(cidarr,
		function(item,callback){
			var qobj={'cid':item.cid,'sid':id,'islast':1};
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				sqlc.query('LOCK TABLES xjos.contest_submit WRITE,xjos.submit WRITE',function(err,rows){
					callback(err,sqlc);
				});
			},
			function(sqlc,callback){
				sqlc.query('UPDATE xjos.contest_submit JOIN xjos.submit ON submit.sid=contest_submit.sid SET islast=0 WHERE cid='+item.cid+' AND pid='+q.pid+' AND uid='+uid,function(err,rows){
					callback(err,sqlc);
				});
			},
			function(sqlc,callback){
				sqlc.query('INSERT INTO xjos.contest_submit SET '+sqlc.escape(qobj),
				function(err,sqlr){
					callback(err,sqlc);
				})
			},
			function(sqlc,callback){
				sqlc.query('UNLOCK TABLES',function(err,rows){
					callback(err);
					sqlc.end();
				});
			}],
			function(err){
				if(err)
					console.log(err);
				callback(err);
			});
		},
		function(err){
			callback(err,cidarr,sqlc,id);
		});
	},
	function(cidarr,sqlc,id,callback){
		sqlc.query('SELECT problem_data_id,problem_data_method,problem_data_score,problem_data_time,problem_data_memory,problem_data_rank,tester FROM xjos.problem_data WHERE pid=?',q.pid,function(err,res){
			callback(err,cidarr,id,res);
			sqlc.end();
		});
	}],
	function(err,cidarr,zid,zpdidl){
		var ret={sid:zid,datalist:zpdidl,datetime:q.datetime};
		var isOkToRetStatus=true;
		if(err){
			ret.status='fail';
			console.log('Submit Fail:'+err);
			return;
		}else{
			ret.status='ok';
		}
//		console.log(ret);
		callback(JSON.stringify(ret));
		for(var i=0;i<cidarr.length;i++){
			if(cidarr[i].type=='OI')
				isOkToRetStatus=false;
		}
		eventbus.on('tcp.judge.'+zid,
		function(dataset){
			sql.getConnection(function(err,sqlc){
				if(err){
					console.log('SUBMIT ERROR:'+err);
					return;
				}
				sqlc.query('SELECT infoboard FROM xjos.submit WHERE sid='+sqlc.escape(zid),function(err,rows){
					if(err){
						console.log('STD-SUBMIT-DB ERROR:'+err);
						sqlc.end();
						return;
					}
					var retobj={'sid':zid,'problem_data_id':dataset[1],'result':dataset[2],'time':dataset[3],'memory':dataset[4],'grade':dataset[5],'infomation':rows[0]['infoboard']};
					sqlc.end();
//					console.log(isOkToRetStatus);
					if(isOkToRetStatus||dataset[1]==-1)
						callback(JSON.stringify(retobj));
				});
			});
		});
	});
}
function updateelo(sid,pid,uid,result,sql){
	async.waterfall([
	function(callback){
		sql.getConnection(function(err,sqlc){
			callback(err,sqlc);
		});
	},
	function(sqlc,callback){
		sqlc.query('SELECT count(*) FROM xjos.problem WHERE sid<'+sqlc.escape(sid)+' AND uid='+sqlc.escape(uid)+' AND pid='+sqlc.escape(pid),function(err,res){callback(err,res[0]['count(*)']+1,sqlc)});
	},
	function(ct,sqlc,callback){
		sqlc.query('SELECT rating FROM xjos.user WHERE uid='+sqlc.escape(uid),function(err,res){
			callback(err,ct,res[0]['rating'],sqlc);
		});
	},
	function(ct,userelo,sqlc,callback){
		sqlc.query('SELECT elo FROM xjos.problem WHERE pid='+sqlc.escape(pid),function(err,res){
			callback(err,ct,userelo,res[0]['elo'],sqlc);
		});
	},
	function(ct,userelo,probelo,sqlc,callback){
		var eloz=elopvp(userelo,probelo,result,ct);
		callback(null,eloz,sqlc);
	},
	function(eloz,sqlc,callback){
		sqlc.query('UPDATE xjos.user SET rating='+sqlc.escape(eloz.person)+' WHERE uid='+sqlc.escape(uid),function(err,res){callback(err,eloz,sqlc);});
	},
	function(eloz,sqlc,callback){
		sqlc.query('UPDATE xjos.problem SET elo='+sqlc.escape(eloz.problem)+' WHERE pid='+sqlc.escape(pid),function(err,res){callback(err);sqlc.end();});
	}],
	function(err){
		console.log('UPDELO ERR:'+err);
	});
}
function gettjdainfo(uid,data,sql,callback){//S1
	if(isNaN(data))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT tjdat.stid,tjdat.sid AS stgid,tjdat.pid,problem_data.problem_data_rank,tjdat.grade,tjdat.isjudged,tjdat.date,problem_data.problem_data_score AS fullscore FROM xjos.problem_data LEFT JOIN (SELECT stid,sid,pid,grade,isjudged,date,rank FROM xjos.submit_tjda WHERE stid IN (SELECT MAX(stid) FROM xjos.submit_tjda WHERE uid='+sqlc.escape(uid)+' AND pid='+sqlc.escape(data)+' GROUP BY rank))AS tjdat ON problem_data.pid=tjdat.pid AND problem_data.problem_data_rank=tjdat.rank WHERE problem_data.pid='+sqlc.escape(data),function(err,rows){
			if(err){
				srvlog('A','Get TJDAInfo'+err);
				callback('SQL ERROR');
			}else{
				sqlc.end();
				callback(null,rows);
			}
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			srvlog('B','Get TJDAInfo'+err);
	})
}
function gettjdainfo_list(uid,data,sql,callback){//S1
	if(isNaN(data))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT MAX(sid)AS stgid,MAX(date) AS date FROM xjos.submit_tjda WHERE uid='+sqlc.escape(uid)+' AND pid='+sqlc.escape(parseInt(data))+' GROUP BY sid',function(err,rows){
			if(err){
				srvlog('A','Get TJDAInfo_List '+err);
				callback('SQL ERROR');
			}else{
				sqlc.end();
				callback(null,rows);
			}
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			srvlog('B','Get TJDAInfo'+err);
	})
}

function gettjdainfo_stgid(uid,data,sql,callback){//S1
	var stgid;
	if(isNaN(data))return;
	try{
		var s=JSON.parse(data);
		stgid=parseInt(s.stgid);
		pid=parseInt(s.pid);
	}catch(e){
		srvlog('B','uid:'+uid+' '+e);
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT tjdat.stid,tjdat.sid,tjdat.pid,problem_data.rank,tjdat.grade,tjdat.isjudged,tjdat.date,problem_data.problem_data_score AS fullscore FROM xjos.problem_data LEFT JOIN (SELECT stid,sid,pid,grade,isjudged,date,rank FROM xjos.submit_tjda WHERE stgid='+sqlc.escape(stgid)+' AND uid='+sqlc.escape(uid)+')AS tjdat ON problem_data.pid=tjdat.pid AND problem_data.problem_data_rank=tjdat.rank WHERE pid='+sqlc.escape(pid),function(err,rows){
			if(err){
				srvlog('A','Get TJDAInfo'+err);
				callback('SQL ERROR');
			}else{
				sqlc.end();
				callback(null,rows);
			}
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			srvlog('B','Get TJDAInfo'+err);
	});
}
function sqlexecsingle(sqlc,str,callback){
	sqlc.query(str,function(err,rows){
		if(err){
			sqlc.end();
			srvlog('A','SQLErr:'+str+' ');
			callback(err,'System error');
		}else if(rows.length<1){
			sqlc.end();
			callback('No such obj','no such obj')
		}else{
			callback(err,sqlc,rows[0]);
		}
	});
}
function mkretstr(err,msg,me){
	var retobj={};
	if(err){
		srvlog('B','Submit.'+me+'Error: '+err);
		retobj['status']='error';
	}else{
		retobj['status']='ok';
	}
	retobj['data']=msg;
	return JSON.stringify(retobj);
}
function paySingleInfo(uid,data,sql,callback){//S1
	var sid=null;
	if(isNaN(uid))return;
	try{
		var pobj=JSON.parse(data);
		sid=parseInt(pobj.sid);
	}catch(e){
		callback('JSON Error');
		return;
	}
	if(isNaN(sid)){
		callback('JSON Error');
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlexecsingle(sqlc,'SELECT gold FROM xjos.user WHERE uid='+sqlc.escape(uid),callback);
	},
	function(sqlc,gold,callback){
		sqlexecsingle(sqlc,'SELECT uid FROM xjos.submit WHERE sid='+sqlc.escape(sid),function(err,sqlc,obj){
			callback(err,sqlc,obj.uid,gold);
		});
	},
	function(sqlc,auid,goldobj,callback){
		var gold=goldobj.gold;
		if(auid==uid){callback(null,sqlc,gold);return;}
		if(gold<0){
			callback('No money','You can\'t');
			return;
		}
		gold=gold-0;
		callback(null,sqlc,gold);
	},
	function(sqlc,gold,callback){
		sqlexecsingle(sqlc,'SELECT * FROM xjos.submit WHERE sid='+sqlc.escape(sid),function(err,sqlc,obj){
			callback(err,sqlc,obj,gold);
		});
	},
	function(sqlc,subobj,gold,callback){
		sqlc.query('UPDATE xjos.user SET gold='+sqlc.escape(gold)+' WHERE uid='+sqlc.escape(uid),function(err,ins){
			callback(err,subobj);
		});
	}],
	function(err,subobj){
		callback(mkretstr(err,subobj,'paySingleInfo'));
	});
}

exports.findcontest=findcontest;
