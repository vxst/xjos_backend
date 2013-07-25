var isok=require('../lib/isok').isok;

exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'common',sql,function(ct){
		if(ct==0)return;
		if(handle==='fetchAppList'){
			fetchAppList(conn.uid,data,sql,callback);
		}
	});
}
function fetchAppList(uid,data,sql,callback){
	if(uid==undefined){
		callback("Must login");
		return;
	}
	if(data==='all'){
		sql.getConnection(function(err,sqlconn){
			sqlconn.query("SELECT xjos.application.aid,app_name,app_url,app_icon_url,app_color,status FROM xjos.application JOIN xjos.application_user ON xjos.application.aid=xjos.application_user.aid WHERE xjos.application.aid IN (SELECT aid FROM xjos.application_user WHERE uid="+sqlconn.escape(uid)+") AND xjos.application_user.uid="+sqlconn.escape(uid),function(err,rows){
				sqlconn.end();
				callback(JSON.stringify(rows));
			});
		});
	}
}
