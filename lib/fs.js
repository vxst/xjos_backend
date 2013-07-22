var fs=require('fs'),
	crypto=require('crypto');
function safebase64(str){
	for(var i=str.length-1;i>=0;i--){
		if(str[i]=='/')str[i]='_';
	return str;
}

exports.renameFile=function(fn,callback){
	var sha=crypto.createHash('sha256');
	//Use first 144 bit/24 char in base64
	var file=fs.ReadStream(fn);
	file.on('data',function(data){
		sha.update(data);
	});
	file.on('end',function(){
		var hash=safebase64(sha.digest('base64').substr(0,24));
	});
}
