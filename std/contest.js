var async=require('async');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(uid==null){
		return;
	}
	if(handle==='list'){
		list(conn.uid,data,sql,callback);
	}else if(handle==='getproblems'){
		getproblems(conn.uid,data,sql,callback);
	}else if(handle==='regcontest'){
		regcontest(conn.uid,data,sql,callback);
	}
}

function regcontest(uid,data,sql,callback){
	if(uid==null){
		console.log('ERR:STD-CONTEST-REGC:Not Login');
		return;
	}
	try{
		var obj=JSON.stringify(data);
		if(typeof(obj.cid)!='number'||typeof(obj.type)!='string'||typeof(obj.start_time)|='string'){
			console.log('ERR');
			return;
		}
		sql.getConnection(function(err,sqlc){
			
		})
	}catch(e){
	}
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
