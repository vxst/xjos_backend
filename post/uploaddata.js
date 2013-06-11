var uncompress=require('../tools/uncompresser').main
	,makepairs=require('../tools/makepairs').main
	,async=require('async')
	,fs=require('fs');

function makeuuid(){
	return crypto.pseudoRandomBytes(12).toString('hex');
}
exports.main=function(path,obj,sql){
	async.waterfall([
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
		uncompresser(arcfn,excdir,function(err){
			callback(err,uuid,dir,excdir);
		});
	},
	function(uuid,dir,excdir,callback){
		fs.readdir(excdir,function(err,files){
			callback(err,uuid,dir,excdir,files);
		});
	},
	function(uuid,dir,excdir,files){
		var p=makepairs(files);
		async.eachSeris(p,
		function(item,callback){
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				var inf=excdir+item.input,outf=excdir+item.output;
				var obj={'problem_data_rank':item.rank,'problem_data_input':fs.readFileSync(inf),'problem_data_output':fs.readFileSync(outf)};
				sqlc.query('INSERT INTO xjos.problem SET '+sqlc.escape(obj),
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
		if(err)
			console.log('UPDFILEERR:'+err);
	});
}
