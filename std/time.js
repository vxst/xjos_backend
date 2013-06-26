exports.gettime=function(conn,handle,dt,sql,cb){
	if(conn.uid==null){
		return;
	}
	cb(JSON.stringify(new Date()));
}
