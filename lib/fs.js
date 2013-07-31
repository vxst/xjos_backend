var fs=require('fs'),
	crypto=require('crypto'),
	async=require('async'),
	commonvars=require('../commonvars');

function safebase64(str){//base64url RFC 4648
	var oldstr=str;
	do{
		oldstr=str;
		str=str.replace('\/','_').replace('\+','\-');
	}while(oldstr!=str);
	return str;
}

exports.renameFile=function(fn,callback){
	var sha=crypto.createHash('sha256');
	//Use first 96 bit/16 char in base64, P(c)<2^-48 for 2^24 files
	var file=fs.ReadStream(fn);
	file.on('data',function(data){
		sha.update(data);
	});
	file.on('end',function(){
		var hash=safebase64(sha.digest('base64').substr(0,16));
		var dirname=hash.substr(0,2);
		var filename=hash;
		console.log('H:'+hash);
		
		async.waterfall([
		function(callback){
			fs.exists(fn,function(isexist){
				if(!isexist){
					callback('No such file');
				}else{
					callback();
				}
			});
		},
		function(callback){
			fs.exists(commonvars.baseurl+'/xjfsfiles/'+dirname,function(isexist){
				callback(null,isexist);
			});
		},
		function(isexist,callback){
			if(isexist)callback();
			else{
				fs.mkdir(commonvars.baseurl+'/xjfsfiles/'+dirname,callback);
			}
		},
		function(callback){
			fs.rename(fn,commonvars.baseurl+'/xjfsfiles/'+dirname+'/'+filename,callback);
		}],
		function(err){
			callback(err,hash);
		});
	});
}
/*exports.renameFile('/home/sttc/nodeserver/lib/empty',function(err,msg){
	console.log('err '+err);
	console.log('msg '+msg);
});*/
