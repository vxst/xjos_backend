var notjson=require('./libjson');
var elopvp=require('./libelo').personvsproblem;
var async=require('async');
var xmlparser=require('xml2js').parseString;
exports.main=function(conn,handle,data,sql,callback,eventbus){//if over 10,use array.
	if(handle==='submit'){
		submit(conn.uid,data,sql,callback,eventbus);
	}else if(handle==='list'){
		list(conn.uid,data,sql,callback);
	}else if(handle==='single'){
		single(conn.uid,data,sql,callback);
	}
}
function list(uid,data,sql,callback){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT sid,xjos.problem.pid,problem_title,language,datetime,status,grade FROM xjos.submit INNER JOIN xjos.problem ON xjos.problem.pid=xjos.submit.pid WHERE uid='+sqlc.escape(uid),
		function(err,rows){
			if(err){
				console.log('ERR:STD-SUBMIT-LIST:'+err);
				callback(err);
			}else
			callback(null,JSON.stringify(rows));
			sqlc.end();
		});
	},
	function(rows,cb){
		callback(rows);
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
				var cuteobj=rows[0];
	//			console.log(cuteobj.result);
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
function submit(uid,data,sql,callback,eventbus){
	var q=notjson.parse(data);
	if(typeof(q)!='object'){
		callback('Json errorA');
		return;
	}
	q.pid=parseInt(q.pid);
	if(q.pid==NaN){
		callback('Json errorC');
		return;
	}
	q.language=parseInt(q.language);
	if(q.language==NaN){
		callback('Json errorD');
		return;
	}
	console.log(typeof(q.pid));
	console.log(typeof(q.language));
	console.log(typeof(q.source));
	if(typeof(q.pid)!='number'||typeof(q.language)!='number'||typeof(q.source)!='string'){
		callback('Json errorB');
		return;
	}
	for(k in q){
		if(k!='pid'&&k!='language'&&k!='source'){
			callback('SUI');
			return;
		}
	}
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	q.datetime=new Date();
	q.uid=uid;
//	console.log(JSON.stringify(q));
	async.waterfall([
	function(callback){
		sql.getConnection(function(err,sqlconn){
			callback(err,sqlconn);
		});
	},
	function(sqlc,callback){
		sqlc.query('INSERT INTO xjos.submit SET ?',q,function(err,res){
			if(typeof(res)!='object'){
				callback('fail');
			}else{
				callback(err,sqlc,res.insertId);
			}
		});
	},
	function(sqlc,id,callback){
		sqlc.query('SELECT problem_data_id,problem_data_method,problem_data_score,problem_data_time,problem_data_memory,problem_data_rank,tester FROM xjos.problem_data WHERE pid=?',q.pid,function(err,res){
			callback(err,id,res,sqlc);
		})
	}],
	function(err,zid,zpdidl,sqlc){
		var ret={sid:zid,datalist:zpdidl,datetime:q.datetime};
		if(err){
			ret.status='fail';
		}else{
			ret.status='ok';
		}
		callback(JSON.stringify(ret));
		eventbus.on('tcp.judge.'+zid,/*function(dataset){
			console.log("SK:"+JSON.stringify(dataset));
			callback(JSON.stringify({sid:zid,problem_data_id:dataset[1],result:dataset[2],time:dataset[3],memory:dataset[4],grade:dataset[5]}));
		}*/
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
					callback(JSON.stringify(retobj));
				});
			});
		});
		//sid:pid:uid:result::
	//	eventbus.on('tcp.judgefinish.'+zid,function(dataset){
	//		updateelo(dataset[0],dataset[1],dataset[2],dataset[3],sql);
	//	});
		sqlc.end();
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
