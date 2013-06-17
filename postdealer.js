var formidable = require('formidable'),
	async =	require('async');
var deal={};
deal['uploaddata']=require('./post/uploaddata').main;

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
exports.main=function(path,response,sql,rawreq,callback){
	findpath(path,sql,function(err,res){
		if(err){
			callback(false);
			return;
		}
		try{
			var k=JSON.parse(res);
			if(deal[k.order]!=undefined){
				var form = new formidable.IncomingForm();
				form.on('end',function(){
					deal[k.order](form.path,k,sql,
					function(errv){
						if(errv=='ok'){
							response.write('ok');
						}else{
							response.write('err');
						}
					});
					callback(true);
				});
			}
		}catch(e){
			console.log(e);
			callback(false);
		}
	});
}
