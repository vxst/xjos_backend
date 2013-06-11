var formidable = require('formidable'),
	async =	require('async'),
	postdealer = require('./postdealer').main;
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
	if(req.method.toLowerCase()=='post'){
		postdealer(path,response,sql,rawreq,function(info){
			if(info!='ok'){
				console.log('Postdealer returns an error:'+info);
			}
		});
	}else{
		handle['NOTFOUND'](path,query,response);
	}
}
