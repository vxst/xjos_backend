var isok=require('../lib/isok').isok,
    async=require('async');
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'edit_problem',sql,
	function(ct){
		if(ct!=0){
			if(handle==='edit'){
				view(conn.uid,data,sql,callback);
			}
		}
	});
	isok(conn.uid,'add_problem',sql,
	function(ct){
		if(ct!=0){
			if(handle==='add'){
				add(conn.uid,data,sql,callback);
			}
		}
	});
}
function view(uid,data,sql,callback){
	sql.getConnection(function(err,sqlconn){
		var p={};
		try{
			p=JSON.parse(data);
			if(typeof(p)!='object'){
				console.log('JPE:UH2E4Q');
			}
		}catch(e){
			return;
		}
//		console.log(p['myid']);
//		console.log("UPDATE xjos.problem SET "+p['myid']+'='+sqlconn.escape(p.data)+' WHERE pid='+sqlconn.escape(p.pid));
		var obj={};
		obj[p.myid]=p.data;
		sqlconn.query("UPDATE xjos.problem SET "+sqlconn.escape(obj)+' WHERE pid='+sqlconn.escape(p.pid),function(err,rows){
			if(!err)
				callback('ok');
			else
				console.log(err);
			sqlconn.end();
		});
	});
}
function add(uid,data,sql,callback){
	var title,content,date,hint,input,output,level;
	try{
		var pobj=JSON.parse(data);
		title=pobj.title;
		content=pobj.content;
		date=new Date();
		input=pobj.input;
		output=pobj.output;
		hint=pobj.hint;
		level=pobj.level;
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		var iobj={'problem_title':title,'problem_description':content,'problem_input':input,'problem_output':output,'levelt':level,'problem_hint':hint,'insdate':date};
		sqlc.query('INSERT INTO xjos.problem SET '+sqlc.escape(iobj),function(err,rows){
			callback(err,rows);
			sqlc.end();
		});
	},
	function(info,cb){
		callback(JSON.stringify({'status':'ok','pid':info.insertId}));
		cb();
	}],
	function(err){
		if(err)
			console.log('Problemedit.add.err:'+err);
	});
}
