var isok=require('../lib/isok').isok;
var async=require('async');
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'edit_problem',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='edit'){
			edit(conn.uid,data,sql,callback);
		}else if(handle==='add'){
			add(conn.uid,data,sql,callback);
		}else if(handle==='del'){
			del(conn.uid,data,sql,callback);
		}
	});
}
//Edit samples for one problem
function edit(uid,data,sql,callback){
	var inputobj=null;
	var orderobj=null;
	var psid=null;
	try{
		inputobj=JSON.parse(data);
		orderobj={};
		orderobj[inputobj['order']]=inputobj['data'];
		psid=inputobj.psid;
	}catch(e){
		console.log('PSample Edit:JSON Error');
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('UPDATE xjos.problem_sample SET '+sqlc.escape(orderobj)+' WHERE problem_sample_id='+sqlc.escape(psid),
		function(err,rows){
			callback(err);
			sqlc.end();
		});
	},
	function(cb){
		callback('ok');
		cb();
	}],
	function(err){
		if(err){
			console.log('PSample Error:'+JSON.stringify(err));
			callback('fail');
		}
	});
}
function add(uid,data,sql,callback){
	var inputobj=null;
	var orderobj=null;
	try{
		inputobj=JSON.parse(data);
		orderobj={'pid':inputobj.pid,'problem_sample_input':inputobj.input,'problem_sample_output':inputobj.output};
	}catch(e){
		console.log('PSample Add:Json Error');
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('INSERT INTO xjos.problem_sample SET '+sqlc.escape(orderobj),
		function(err,rows){
			callback(err);
			sqlc.end();
		});
	},
	function(cb){
		callback('ok');
		cb();
	}],
	function(err){
		if(err){
			console.log('PSample Error:'+JSON.stringify(err));
			callback('fail');
		}
	});
}
function del(uid,data,sql,callback){
	var inputobj=null;
	var psid=null;
	try{
		inputobj=JSON.parse(data);
		psid=parseInt(inputobj.psid);
		if(isNaN(psid))
			throw 'Apple Died!';
	}catch(e){
		console.log('PSample Add:Json Error');
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('DELETE FROM xjos.problem_sample WHERE problem_sample_id='+sqlc.escape(psid),
		function(err,rows){
			callback(err);
			sqlc.end();
		});
	},
	function(cb){
		callback('ok');
		cb();
	}],
	function(err){
		if(err){
			console.log('PSample Error:'+JSON.stringify(err));
			callback('fail');
		}
	});
}
function view(uid,data,sql,callback){
	var inputobj=null;
	var pid=null,psid=null;
	try{
		inputobj=JSON.parse(data);
		if(inputobj.pid!=undefined)
			pid=inputobj.pid;
		if(inputobj.psid!=undefined)
			psid=inputobj.psid;
	
	}catch(e){
		console.log(e);
	}
}
