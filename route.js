exports.route=function(path,query,response,handle){
//	console.log('Route for path:'+path);
	if(handle[path]===undefined)
		callpath='NOTFOUND';
	else
		callpath=path;
	handle[callpath](path,query,response);
}
