var notjson=require('./libjson');
var elopvp=require('./libelo').personvsproblem;
var async=require('async');
var xmlparser=require('xml2js').parseString;
var isok=require('../lib/isok').isok;

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
		}else if(handle==='single'){
			single(conn.uid,data,sql,callback);
		}else if(handle==='muiltiply'){
			muiltiply(conn.uid,data,sql,callback);
		}
	});
}
function findcontest(uid,pid,sql,callback){//S1
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT user_contest.cid,contest.type FROM xjos.user_contest NATURAL JOIN xjos.contest_problem,xjos.contest WHERE contest_problem.pid='+sqlc.escape(pid)+' AND user_contest.uid='+sqlc.escape(uid)+' AND user_contest.start_time<NOW() AND user_contest.end_time>NOW()',
		function(err,rows){
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
function list(uid,data,sql,callback){//S2
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT sid,xjos.problem.pid,problem_title,language,datetime,status,grade FROM xjos.submit INNER JOIN xjos.problem ON xjos.problem.pid=xjos.submit.pid WHERE uid='+sqlc.escape(uid)+' ORDER BY sid ASC',
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
		sqlc.query('SELECT sid FROM xjos.contest_submit INNER JOIN xjos.user_contest ON user_contest.cid=contest_submit.cid WHERE uid='+sqlc.escape(uid)+' AND start_time<NOW() AND end_time>NOW() ORDER BY sid ASC',
		function(err,rows){
			cb(err,rows,rowstatus);
			sqlc.end();
		});
	},
	function(sidarr,sbmarr,cb){
		for(var i=0,j=0;i<sbmarr.length&&j<sidarr.length;i++){
			while(sbmarr[i].sid>sidarr[j].sid)
				j++;
			if(sbmarr[i].sid==sidarr[j].sid){
				sbmarr[i]['status']=sbmarr[i]['grade']=null;
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
function single(uid,data,sql,callback){
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
		sqlc.query('SELECT problem.problem_title,submit.* FROM xjos.submit INNER JOIN xjos.problem ON xjos.problem.pid=xjos.submit.pid WHERE sid='+sqlc.escape(data)+' AND uid='+sqlc.escape(uid),
		function(err,rows){
			if(err){
				callback('System Error');
				cb(err);
			}else if(rows.length<1){
				callback('{err="no result"}');
				cb('No result');
			}else{
				destatus(rows);
				var cuteobj=rows[0];
				xmlparser(cuteobj.result,{explicitArray:false},
				function(err,res){
					cuteobj.result=res.res.point;
					cb(null,cuteobj);
				});
			}
			sqlc.end();
		});
	},
	function(cuteobj,callback){
		sql.getConnection(function(err,sqlc){
			if(err){
				callback(err);
				return;
			}else{
				callback(null,cuteobj,sqlc);
			}
		});
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
	var subobj={'pid':q.pid,'language':q.language,'source':q.source,'datetime':new Date(),'uid':uid};

	async.waterfall([
	function(callback){
		var c=findcontest(uid,q.pid,sql,function(ret){
			if(ret==null)
				callback('Submit ERR:Find Contest Module Error');
			else
				callback(null,ret);
		});
	},
	function(cidarr,callback){
		sql.getConnection(function(err,sqlconn){
			callback(err,cidarr,sqlconn);
		});
	},
	function(cidarr,sqlc,callback){
		sqlc.query('INSERT INTO xjos.submit SET ?',subobj,function(err,res){
			if(err){
				callback('Submit SQL Insert Fail');
			}else{
				callback(err,cidarr,sqlc,res.insertId);
			}
		});
	},
	function(cidarr,sqlc,id,callback){
		async.each(cidarr,
		function(item,callback){
			sql.getConnection(function(err,sqlc){
				var qobj={'cid':item.cid,'sid':id};
				sqlc.query('INSERT INTO xjos.contest_submit SET '+sqlc.escape(qobj),
				function(err,sqlr){
					if(err)
						callback(err);
					sqlc.end();
				});
			});
		},
		function(err){
			callback(err,cidarr,sqlc,id);
		});
	},
	function(cidarr,sqlc,id,callback){
		sqlc.query('SELECT problem_data_id,problem_data_method,problem_data_score,problem_data_time,problem_data_memory,problem_data_rank,tester FROM xjos.problem_data WHERE pid=?',q.pid,function(err,res){
			callback(err,cidarr,id,res,sqlc);
		});
	}],
	function(err,cidarr,zid,zpdidl,sqlc){
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
					if(isOkToRetStatus)
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
