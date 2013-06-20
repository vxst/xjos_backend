var isok=require('../lib/isok').isok;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'edit_problem',sql,
	function(ct){
		if(ct!=0){
			if(handle==='edit'){
				view(conn.uid,data,sql,callback);
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
