var async=require('async');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(handle==='list'){
		list(conn.uid,data,sql,callback);
	}else if(handle==='fetch'){
		fetch(conn.uid,data,sql,callback);
	}else if(handle==='edit'){
		edit(conn.uid,data,sql,callback);
	}
}

function edit(uid,data,sql,callback){
	if(uid==null){
		console.log("ERR:STD-PROBLEMDATA-EDIT:Not Login");
		return;
	}
	try{
		var dataobj=JSON.stringify(data);
		if(typeof(dataobj.input)!='string'||typeof(dataobj.output)!='string'||typeof(dataobj.pdid)!='number'){
			console.log("ERR:STD-PROBLEMDATA-EDIT:JSON");
			return;
		}
	}catch(e){
		console.log("ERR:STD-PROBLEMDATA-EDIT:JSON");
		return;
	}
	async.waterfall([
	function(cb){
		sql.getConnection(cb);
	},
	function(sqlc,cb){
		sqlc.query("UPDATE xjos.problem_data SET problem_data_input="+sqlc.escape(dataobj.input)+", problem_data_output="+sqlc.escape(dataobj.output)+" WHERE problem_data_id="+sqlc.escape(dataobj.pdid),function(err,rows){
			if(!err){
				callback('ok');
			}
			cb(err);
			sqlc.end();
		});
	}],
	function(err){
		if(err)
			console.log("ERR:STD-PROBLEMDATA-EDIT:"+err);
	});
}


function list(uid,data,sql,callback){
	if(uid==null){
		console.log("ERR:STD-PROBLEMDATA-LIST:Not Login");
		return;
	}
	var pid=parseInt(data);
	if(pid==NaN){
		console.log("ERR:STD-PROBLEMDATA-LIST:pid:"+data);
		return;
	}
	async.waterfall([
	function(cb){
		sql.getConnection(cb);
	},
	function(sqlc,cb){
		sqlc.query("SELECT problem_data_id,problem_data_method,problem_data_score,problem_data_time,problem_data_memory,problem_data_rank,tester FROM xjos.problem_data WHERE pid="+sqlc.escape(pid),
		function(err,rows){
			if(!err)
				callback(JSON.stringify(rows));
			sqlc.end();
			cb(err);
		});
	}],
	function(err){
		if(err)
			console.log("ERR:STD-PROBLEMDATA-LIST:"+err);
	});
}
function fetch(uid,data,sql,callback){
	if(uid==null){
		console.log("ERR:STD-PROBLEMDATA-FETCH:Not Login");
		return;
	}
	var pdid=parseInt(data);
	if(pdid==NaN){
		console.log("ERR:STD-PROBLEMDATA-FETCH:pdid:"+data);
		return;
	}
	async.waterfall([
	function(cb){
		sql.getConnection(cb);
	},
	function(sqlc,cb){
		sqlc.query("SELECT LENGTH(problem_data_input) AS in_length,LENGTH(problem_data_output) AS out_length FROM xjos.problem_data WHERE problem_data_id="+sqlc.escape(pdid),function(err,rows){
			if(err){
				sqlc.end();
			}
			cb(err,rows,sqlc);
		});
	},
	function(rows,sqlc,cb){
		if(rows.length<1){
			cb("NoTFounD");
		}else{
			cb(null,rows[0].in_length,rows[0].out_length,sqlc);
		}
	},
	function(inl,outl,sqlc,cb){
		if(inl>4096){
			sqlc.query("SELECT CONCAT(LEFT(problem_data_input,4096),'...') AS pin WHERE problem_data_id="+sqlc.escape(pdid),
			function(err,rows){
				if(err){
					sqlc.end();
				}
				cb(err,rows[0].pin,inl,outl,sqlc);
			});
		}else{
			sqlc.query("SELECT problem_data_input AS pin WHERE problem_data_id="+sqlc.escape(pdid),
			function(err,rows){
				if(err){
					sqlc.end();
				}
				cb(err,rows[0].pin,inl,outl,sqlc);
			});
		}
	},
	function(pin,inl,outl,sqlc,cb){
		if(outl>4096){
			sqlc.query("SELECT CONCAT(LEFT(problem_data_output,4096),'...') AS pout WHERE problem_data_id="+sqlc.escape(pdid),
			function(err,rows){
				cb(err,pin,rows[0].pout,inl,outl);
				sqlc.end();
			});
		}else{
			sqlc.query("SELECT problem_data_output AS pout WHERE problem_data_id="+sqlc.escape(pdid),
			function(err,rows){
				cb(err,pin,rows[0].pout,inl,outl);
				sqlc.end();
			});
		}
	},
	function(pin,pout,inl,outl,cb){
		var retobj={'input':pin,'output':pout,'input_length':inl,'output_length':outl};
		callback(JSON.stringify(retobj));
	}],
	function(err){
		if(err)
			console.log("ERR-STD-PROBLEMDATA-FETCH:"+err);
	});
}

