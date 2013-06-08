var async=require('async');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(handle==='list'){
		list(conn.uid,data,sql,callback);
	}else if(handle==='getproblems'){
		getproblems(conn.uid,data,sql,callback);
	}
}

function _getRandomProblem(level,callback){
	sql.getConnection(function(err,sqlc){
		sqlc.query('SELECT pid FROM xjos.problem WHERE levelt>'+sqlc.escape(level-5)+' AND levelt<'+sqlc.escape(level+5),function(err,rows){
			if(err){
				console.log('STD-CB:XJOS Problem Fetch ERROR');
				return;
			}
			callback(rows[Math.round(Math.random()*rows.length)].pid);
			sqlc.end();
		}));
	});
}
function _makeSimpleContest(level,problemct,diff,callback){
	var s=[],o=[];
	var pidsz={},pids=[];
	for(var i=0;i<problemct;i++){
		o.push(i);
		s.push(level-problemct*diff+i*2*diff);
	}
	async.each(o,function(i,cb){//P!
		_getRandomProblem(s[i],function(pid){
			pidsz[i]=pid;
			cb(null);
		});
	},function(err){
		if(err){
			console.log('Contest Make Failed');
			callback(null);
		}else{
			for(var i=0;i<problemct;i++){
				pids.push(pidsz[i]);
			}
			callback(pids);
		}
	});
}
function _checkContest(pids,callback){
	sql.getConnection(function(err,sqlc){
		sqlc.query('SELECT count(*) AS ct FROM xjos.problem_ktag JOIN problem_ktag_map ON problem_ktag_map.ptid = problem_ktag.ptid WHERE pid IN('+pids+') GROUP BY type',
		function(err,rows){
			if(err){
				sqlc.end();
				callback(null);
			}else{
				for(var i=0;i<rows.length;i++){
					if(rows[i].ct>2){
						sqlc.end();
						callback(false);
						return;
					}
				}
				sqlc.end();
				callback(true);
			}
		});
	})
}
function makeContest(level,problemct,diff,callback){
	var isok=0;
	if(problemct>5)return;
	async.until(
	function(){
		return isok;
	},
	function(callback){
		_makeSimpleContest(level,problemct,diff,function(pids){
			if(pids==null){
				console.log('Contest Can\'t be built; Exiting...');
			}else{
				_checkContest(pids,function(ok){
					isok=ok;
					callback();
				});
			}
		});
	},
	function(){
		callback(JSON.stringify(pids));
	});
}


function list(uid,data,sql,callback){
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
			sqlc.query("SELECT * FROM xjos.contest",function(err,rows){
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
function getproblems(uid,data,sql,callback){
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
		sqlc.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE pid IN (SELECT pid FROM xjos.contest_problem WHERE cid="+sqlc.escape(cid)+')',
		function(err,rows){
			if(!err)
				callback(JSON.stringify(rows));
			sqlc.end();
			cb(err);
		});
	}],
	function(err){
		if(err)
			console.log("ERR:STD-CONTEST-GETP:"+err);
	});
}
