var uncompress=require('../tools/uncompresser').main
	,makepairs=require('../tools/makepairs').main
	,async=require('async')
	,fs=require('fs')
	,crypto=require('crypto')
	,isok=require('../lib/isok');

function makeuuid(){
	return crypto.pseudoRandomBytes(16).toString('hex');
}
exports.main=function(path,obj,uid,sql,pscb){
	console.log("Papa:"+path);
	if(isNaN(obj.uid))return;
	if(isNaN(obj.pid))return;
	async.waterfall([
	function(callback){
		isok(uid,'submit_problem',sql,function(ct){
			if(ct!=0){
				callback();
			}else{
				callback('POST_SUBMIT:NO PRIV');
			}
		});
	},
	function(callback){
		fs.exist('/tmp/xjosuploadtmp/',function(isexist){
			if(isexist){
				callback();
			}else{
				fs.mkdir('/tmp/xjosuploadtmp',function(err){
					callback(err);
				});
			}
		});
	},
	function(callback){
		var uuid=makeuuid();
		var dir='/tmp/xjosuploadtmp/'+uuid+'/';
		fs.mkdir(dir,
		function(err){
			callback(err,uuid,dir);
		});
	},
	function(uuid,dir,callback){
		var archivefilename=dir+obj.filename;
		fs.rename(path,archivefilename,function(err){
			callback(err,uuid,dir,archivefilename);
		});
	},
	function(uuid,dir,arcfn,callback){
		fs.mkdir(dir+'excplace/',
		function(err){
			callback(err,uuid,dir,arcfn,dir+'excplace/');
		});
	},
	function(uuid,dir,arcfn,excdir,callback){
		uncompress(arcfn,excdir,function(err){
			callback(err,uuid,dir,excdir);
		});
	},
	function(uuid,dir,excdir,callback){
		fs.readdir(excdir,function(err,files){
			callback(err,uuid,dir,excdir,files);
		});
	},
	function(uuid,dir,excdir,files,callback){
		var p=makepairs(files);
		console.log('ITEM:'+JSON.stringify(files));
		async.eachSeries(p,
		function(item,callback){
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				var inf=excdir+item.input,outf=excdir+item.output;
				var t={'problem_data_rank':item.rank,'problem_data_input':fs.readFileSync(inf),'problem_data_output':fs.readFileSync(outf),'pid':obj.pid,'uid':obj.uid};
				sqlc.query('INSERT INTO xjos.problem_data_tjda SET '+sqlc.escape(t),
				function(err,rows){
					sqlc.end();
					if(err){
						callback(err);
					}else{
						callback();
					}
				});
			}],
			function(err){
				if(err){
					callback(err);
				}else{
					callback();
				}
			});
		},
		function(err){
			if(err)
				callback(err);
		});
	}],
	function(err){
		if(err){
			console.log('UPDFILEERR:'+err);
			pscb('err:'+err);
		}else{
			pscb('ok');
		}
	});
}
