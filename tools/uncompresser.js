var exec = require('child_process').exec;
var filedealer={};
function etexec(command,callback){
	exec(command,
	function(err,stdout,stderr){
		if(err){
			console.log('ERRTAR:'+err);
			callback('failed');
		}else{
			callback();
		}
	});
}
filedealer['tar']=function(filepath,to,callback){
	etexec('tar xf '+filepath+' -C '+to,callback);
}
filedealer['tar.gz']=filedealer['tar.xz']=filedealer['tar.bz2']=filedealer['tar'];
filedealer['zip']=function(filepath,to,callback){
	etexec('unzip '+filepath+' -d '+to,callback);
}
filedealer['rar']=function(filepath,to,callback){
	etexec('unrar e '+filepath+' '+to,callback);
}
filedealer['7z']=function(filepath,to,callback){
	etexec('7za x '+filepath+' -o'+to,callback);
}
function endswith(str,suffix) {
	return str.indexOf(suffix,str.length-suffix.length)!==-1;
};
function findext(filepath){
	for(k in filedealer){
		if(endswith(filepath,k))
			return k;
	}
	return null;
}
exports.main=function(filepath,to,callback){
	if(findext(filepath)!=null){
		filedealer[findext(filepath)](filepath,to,callback);
	}else{
		callback('Not found ext type');
	}
}
