var formidable = require('formidable'),
	async =	require('async');
var deal={};
deal['uploaddata']=require('./post/uploaddata').main;
deal['submittjdaprob']=require('./post/submittjdaprob').main;

function findpath(path,sql,callback){
	if(path.length!=33)return;
	sql.getConnection(function(err,sqlc){
		if(err){
			console.log('ERROR!');
		}else{
			sqlc.query('SELECT * from xjos.posttable WHERE ptuuid='+sqlc.escape(path.substr(1)),
			function(err,rows){
				if(err){
					console.log('ERROR!');
				}else{
					if(rows.length<1){
						callback('NOT FOUND');
					}
					callback(null,rows[0].info,rows[0].uid);
				}
				sqlc.end();
			});
		}
	})
}
exports.main=function(path,response,sql,rawreq,callback){
	findpath(path,sql,function(err,res,uid){
		if(err){
			callback(err);
			return;
		}
		try{
			var k=JSON.parse(res);
			if(typeof(k)!='object'){
				console.log('Post Error');
				return;
			}

			if(deal[k.order]!=undefined){
				var form = new formidable.IncomingForm();
				form.parse(rawreq,function(err,fields,files){
//					console.log(JSON.stringify(fields));
//					console.log(JSON.stringify(files));
					for(var i in files){
						k.filename=files[i].name;
						deal[k.order](files[i].path,k,uid,sql,
						function(errv){
							if(errv=== 'ok'){
								response.write('ok');
							}else{
								response.write('err');
							}
						});
					}
					callback('ok');
				});
//				form.parse(rawreq);
			}else{
				callback('Order not defined');
			}
		}catch(e){
			console.log(e);
			callback(false);
		}
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
