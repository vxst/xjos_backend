var formidable = require('formidable'),
	async =	require('async'),
	postdealer = require('./postdealer').main;
	postchecker=require('./postdealer').check;
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
exports.route=function(path,query,response,handle,sql,rawreq,callback){
//	console.log('Route for path:'+path+'\nrawreq:'+rawreq['']);
	if(rawreq.method.toLowerCase()==='options'){
		postchecker(path,sql,function(istrue){
			if(istrue){
				response.writeHead(200, {'Content-Type': 'text/plain','Server':'ST Dynamic Server','Access-Control-Allow-Origin':'https://xjos.org','Access-Control-Allow-Headers':'cache-control, origin, x-requested-with, content-type'});
			}
			callback();
		});
	}else if(rawreq.method.toLowerCase()==='post'){
		postdealer(path,response,sql,rawreq,function(info){
			if(info!='ok'){
				console.log('Postdealer returns an error:'+info);
			}else{
				response.writeHead(200, {'Content-Type': 'text/plain','Server':'ST Dynamic Server','Access-Control-Allow-Origin':'https://xjos.org','Access-Control-Allow-Headers':'cache-control, origin, x-requested-with, content-type'});
				response.write('{"success":true}');
			}
			callback();
		});
	}else{
		handle['NOTFOUND'](path,query,response);
		callback();
	}
}
