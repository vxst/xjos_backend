exports.gettime=function(conn,handle,dt,sql,cb){
	cb(JSON.stringify(new Date()));
}
