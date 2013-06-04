exports.main=function(conn,handle,data,sql,callback){
	if(handle==='view'){
		view(conn.uid,data,sql,callback);
	}
}
function view(uid,data,sql,callback){
	if(typeof(uid)=='undefined'){
		callback('Must login');
		return;
	}
		sql.getConnection(function(err,sqlconn){
			var pid=parseInt(data);
			if(pid===NaN){
				return;
			}
			sqlconn.query("SELECT pid,problem_title,problem_description,problem_input,problem_output,problem_hint,elo FROM xjos.problem WHERE pid="+sqlconn.escape(pid),function(err,rows){
				if(!err)
					callback(JSON.stringify(rows[0]));
				else callback('VIEW ERROR');
				sqlconn.end();
			});
		});
}
