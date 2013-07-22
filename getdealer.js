var fs = require('fs'),
	async =	require('async');

function findgetpath(path,sql,callback){
	if(path.length!=33)return;
	sql.getConnection(function(err,sqlc){
		if(err){
			console.log('ERROR!');
		}else{
			sqlc.query('SELECT * from xjos.gettable WHERE uuid='+sqlc.escape(path.substr(1))+' AND expire>NOW()',
			function(err,rows){
				if(err){
					console.log('ERROR!');
				}else{
					if(rows.length<1){
						callback('NOT FOUND');
					}
					callback(null,rows[0].uuid,rows[0].hash);
				}
				sqlc.end();
			});
		}
	});
}
exports.main=function(path,response,sql,rawreq,callback){
	findgetpath(path,sql,function(err,uuid,hash){
		if(err){
			callback(err);
			return;
		}
		var stream=fs.createReadStream('files/'+hash,{'bufferSize':64*1024}).pipe(response);
/*		stream.on('open',function(){
			stream.pipe(response);
		});
		stream.on('err',function(err){
			res.end(err);
		});*/
	});
}
exports.check=function(path,sql,callback){
	findpath(path,sql,function(err,res){
		if(err){
			callback(false);
		}else{
			callback(true);
		}
	});
}
