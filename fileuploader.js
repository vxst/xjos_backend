var formidable = require('formidable'),
	async =	require('async');
var deal={};
deal['uploaddata']=require('./post/uploaddate').main;
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
exports.upload=function(path,response,sql,rawreq,callback){
	findpath(path,sql,function(err,res){
		if(err){
			callback(false);
			return;
		}
		try{
			var k=JSON.parse(res);
			if(req.method.toLowerCase() != 'post'){
				throw'Not Post';
			}
			if(deal[k.order]!=undefined){
				var form = new formidable.IncomingForm();
				form.on('end',function(){
					deal[k.order](form.path,k);
					response.write('ok');
					callback(true);
				});
			}
		}catch(e){
			console.log(e);
			callback(false);
		}
	});
}
