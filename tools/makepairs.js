function getnum(filename){
	var start,end,flag=0;
	for(var i=filename.length-1;i>=0;i--){
		if(!isNaN(filename[i])&&flag==0){
			end=i+1;flag=1;
		}
		if(isNaN(filename[i])&&flag==1){
			start=i;flag=2;
		}
	}
	if(flag!=2)
		return null;
	return filename.substring(start,end);
}
var inword=['in','st'];
var outword=['out','ans','nsk'];
function getinout(filename){
	var value=0;
	for(var i=0;i<inword.length;i++){
		if(filename.indexOf(inword[i])!=-1){
			value--;
		}
	}
	for(var i=0;i<outword.length;i++){
		if(filename.indexOf(outword[i])!=-1){
			value++;
		}
	}
}
function remove(filename){
	if(getnum(filename)==null)return true;
}
function makepair(s){
	var tmpobj={},retarray=[];
	for(var i=0;i<s.length;i++){
		if(!remove(s[i])){
			var k=getnum(s[i]);
			if(tmpobj[k]==undefined)
				tmpobj[k]=[];
			tmpobj[k].push(s[i]);
		}
	}
	for(var i in tmpobj){
		tmpobj[i].sort(function(a,b){
			return(getinout(a)-getinout(b));
		});
		retarray.push({'rank':i,'input':tmpobj[i][0],'output':tmpobj[i][tmpobj[i].length-1]});
	}
	return retarray;
}
exports.main=makepair;
