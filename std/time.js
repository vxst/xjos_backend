exports.gettime=function(conn,handle,dt,sql,cb){
	cb((new Date()).getTime().toString());
}
