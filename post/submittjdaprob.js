var uncompress=require('../tools/uncompresser').main
	,makepairs=require('../tools/makepairs').main
	,async=require('async')
	,fs=require('fs')
	,crypto=require('crypto')
	,isok=require('../lib/isok').isok
	,srvlog=require('../lib/log').srvlog
	,findcontest=require('../std/submit').findcontest;
function makeuuid(){
	return crypto.pseudoRandomBytes(16).toString('hex');
}
function getstgid(callback,sql){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('LOCK TABLE xjos.submit_tjda_mxstgid WRITE',function(err,rows){
			if(err)
				sqlc.end();
			callback(err,sqlc);
		});
	},
	function(sqlc,callback){
		sqlc.query('SELECT maxstgid AS mxstgid FROM xjos.submit_tjda_mxstgid',function(err,rows){
			if(err)
				sqlc.end();
			if(err)callback(err);
			if(rows.length!=1)callback('L Error');
			callback(err,sqlc,rows[0].mxstgid);
		});
	},
	function(sqlc,mxstgid,callback){
		sqlc.query('UPDATE xjos.submit_tjda_mxstgid SET maxstgid='+sqlc.escape(mxstgid+1),function(err,rows){
			if(err)
				sqlc.end();
			callback(err,sqlc,mxstgid);
		});
	},
	function(sqlc,mxstgid,callback){
		sqlc.query('UNLOCK TABLES',function(err,rows){
			callback(err,mxstgid);
			sqlc.end();
		});
	},
	function(mxstgid,cb){
		callback(mxstgid);
		cb();
	}],
	function(err){
		if(err)
			srvlog('A',err);
	});
}
exports.main=function(path,obj,uid,sql,pscb){
//	console.log("Papa:"+path);
	obj.uid=uid;
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
		fs.exists('/tmp/xjosuploadtmp/',function(isexist){
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
//		console.log('Dadi'+dir);
		fs.mkdir(dir,
		function(err){
			callback(err,dir);
		});
	},
	function(dir,callback){
		var archivefilename=dir+obj.filename;
		fs.rename(path,archivefilename,function(err){
			callback(err,dir,archivefilename);
		});
	},
	function(dir,arcfn,callback){
		fs.mkdir(dir+'excplace/',
		function(err){
			callback(err,dir,arcfn,dir+'excplace/');
		});
	},
	function(dir,arcfn,excdir,callback){
		uncompress(arcfn,excdir,function(err){
			callback(err,dir,excdir);
		});
	},
	function(dir,excdir,callback){
		fs.readdir(excdir,function(err,files){
			callback(err,dir,excdir,files);
		});
	},
	function(dir,excdir,files,callback){
		sql.getConnection(function(err,sqlc){
			callback(err,sqlc,dir,excdir,files);
		});
	},
	function(sqlc,dir,excdir,files,callback){
		var insobj={'pid':obj.pid,'uid':obj.uid,'datetime':new Date(),'language':9,'source':'TJDA Prob','status':4096,'infoboard':'','result':'','ptype':'TJDA'};
		sqlc.query('INSERT INTO xjos.submit SET '+sqlc.escape(insobj),
		function(err,res){
			if(err){
				callback(err);
				sqlc.end();
			}else
				callback(err,dir,excdir,files,res.insertId,sqlc);
		});
	},
	function(dir,excdir,files,sid,sqlc,callback){
		findcontest(obj.uid,obj.pid,sql,function(ret){
			if(ret==null){
				callback('Find Contest Error');
				sqlc.end();
			}else{
				sqlc.end();
				callback(null,ret,dir,excdir,files,sid);
			}
		});
	},
	function(cidarr,dir,excdir,files,sid,callback){
		async.eachSeries(cidarr,
		function(item,callback){
			var qobj={'cid':item.cid,'sid':sid,'islast':1};
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				sqlc.query('LOCK TABLES xjos.contest_submit WRITE,xjos.submit WRITE',function(err,rows){
					callback(err,sqlc);
				});
			},
			function(sqlc,callback){
				sqlc.query('UPDATE xjos.contest_submit JOIN xjos.submit ON submit.sid=contest_submit.sid SET islast=0 WHERE cid='+item.cid+' AND pid='+obj.pid+' AND uid='+obj.uid,function(err,rows){
					callback(err,sqlc);
				});
			},
			function(sqlc,callback){
				sqlc.query('INSERT INTO xjos.contest_submit SET '+sqlc.escape(qobj),
				function(err,sqlr){
					callback(err,sqlc);
				})
			},
			function(sqlc,callback){
				sqlc.query('UNLOCK TABLES',function(err,rows){
					callback(err);
					sqlc.end();
				});
			}],
			function(err){
				if(err)
					console.log(err);
				callback(err);
			});
		},
		function(err){
			callback(err,dir,excdir,files,sid);
		});
	},
	function(dir,excdir,files,sid,callback){
		var p=makepairs(files);
		console.log('ITEM:'+JSON.stringify(files)+' SID:'+sid);
		async.eachSeries(p,
		function(item,callback){
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				console.log('GG');
				var inf=excdir+item.input,outf=excdir+item.output;
				var t={'rank':item.rank,'output':fs.readFileSync(outf),'pid':obj.pid,'uid':obj.uid,'grade':0,'isjudged':0,'sid':sid,'date':new Date()};
				sqlc.query('INSERT INTO xjos.submit_tjda SET '+sqlc.escape(t),
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
				srvlog('B',err);
		});
	}],
	function(err){
		if(err){
			console.log('UPDFILEERR:'+JSON.stringify(err));
			pscb('err:'+err);
		}else{
			pscb('ok');
		}
	});
}
