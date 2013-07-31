var formidable = require('formidable'),
	async =	require('async');
var deal={};
var fs=require('./lib/fs');
var nfs=require('fs');
deal['uploaddata']=require('./post/uploaddata').main;
deal['submittjdaprob']=require('./post/submittjdaprob').main;

function findpathfs(path,sql,callback){
	if(path.length!=12)return;
	sql.getConnection(
	function(err,sqlc){
		if(err){
			console.log('ERROR!');
		}else{
			sqlc.query('SELECT * from xjos.fsposttable WHERE uuid='+sqlc.escape(path),
			function(err,rows){
				if(err){
					console.log('ERROR!');
				}else{
					if(rows.length<1){
						callback('NOT FOUND');
					}
					callback(null,rows[0].dir,rows[0].uid,rows[0].fauuid,rows[0].name,rows[0].metadata);
				}
				sqlc.end();
			});
		}
	})
}
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
	if(path.substr(0,10)=='/xjfspost/'){
		console.log('a');
		findpathfs(path.substr(10),sql,function(err,dir,uid,fauuid,name,metadata){
			if(err){
				callback(err);
				return;
			}else{
		console.log('b');
				var form = new formidable.IncomingForm();
				form.parse(rawreq,function(err,fields,files){
					for(var i in files){
						console.log(nfs.readFileSync(files[i].path));
						var path=files[i].path;
						fs.renameFile(files[i].path,
						function(err,hash){
							if(err){
								callback(err);
								return;
							}
							sql.getConnection(function(err,sqlc){
								if(err){
									callback(err);
									return;
								}
								var insobj={'uid':uid,'filetype':'plain','hash':hash,'fatherunid':fauuid,'name':name,'metadata':metadata,'size':files[i].size,'dir':dir};
								sqlc.query('INSERT INTO xjos.sfs_usrnode SET '+sqlc.escape(insobj),function(err,sql){
									if(err){
										console.log(err);
										return;
									}
									callback('ok');
		console.log('c');
								});
							});
						});
					}
				});
			}
		});
	}
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
