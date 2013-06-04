//FIXIT: escapeId
exports.main=function(conn,handle,data,sql,callback){
	if(handle==='edit'){
		view(conn.uid,data,sql,callback);
	}
}
function view(uid,data,sql,callback){
	sql.getConnection(function(err,sqlconn){
		var p;
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
		sqlconn.query("UPDATE xjos.problem SET "+p['myid']+'='+sqlconn.escape(p.data)+' WHERE pid='+sqlconn.escape(p.pid),function(err,rows){//DANGEROUS
			if(!err)
				callback('ok');
			else
				console.log(err);
			sqlconn.end();
		});
	});
}
