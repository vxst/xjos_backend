exports.parse=function(str){
	var ret=null;
	try{
		ret=JSON.parse(str);
	}catch(e){
		return null;
	}
	return ret;	
}
