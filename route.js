var formidable = require('formidable'),
	async =	require('async');
function findpath(path,sql,callback){
	sql.getConnection(function(err,sqlc){
		if(err){
			console.log('ERROR!');
		}else{
			sqlc.query('SELECT * from xjos.posttable WHERE ptuuid='+sqlc.escape(path),
			function(err,rows){
				if(err){
					console.log('ERROR!');
				}else{
					if(rows.length<1){
						callback('NOT FOUND');
					}
					callback(null,rows[0].info);
				}
				sqlc.end();
			});
		}
	})
}
exports.route=function(path,query,response,handle,sql,rawreq){
//	console.log('Route for path:'+path);
	findpath(path,sql,function(err,res){
		if(err){
			return;
		}
		try{
			var k=JSON.parse(res);
			if(req.method.toLowerCase() != 'post'){
				throw'Not Post';
			}
			if(k.order=='uploaddata'){
				var form = new formidable.IncomingForm();
				form.on('end',function(){
					response
				});
			}
		}catch(e){
			console.log(e);
		}
	})
	if(handle[path]===undefined)
		callpath='NOTFOUND';
	else
		callpath=path;
	handle[callpath](path,query,response);
}
