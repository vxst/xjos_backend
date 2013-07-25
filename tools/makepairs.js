function getnum(filename){
	var start,end,flag=0;
	for(var i=filename.length-1;i>=0;i--){
		if(!isNaN(filename[i])&&flag==0){
			end=i+1;flag=1;
		}
		if(isNaN(filename[i])&&flag==1){
			start=i+1;flag=2;
		}
	}
	if(flag==1){
		start=0;flag=2;
	}
	if(flag!=2){
		return null
	}
	return filename.substring(start,end);
}
var inword=['in','st'];
var outword=['out','ans','nsk','ou'];
function getinout(filename){
	var value=0;
	for(var i=0;i<inword.length;i++){
		if(filename.toLowerCase().indexOf(inword[i])!=-1){
			value--;
		}
	}
	for(var i=0;i<outword.length;i++){
		if(filename.toLowerCase().indexOf(outword[i])!=-1){
			value++;
		}
	}
}
function remove(filename){
	if(getnum(filename)==null)return true;
}
function makepair(s){
	var tmpobj={},retarray=[];
//	console.log(s);
	for(var i=0;i<s.length;i++){
		if(!remove(s[i])){
			var k=getnum(s[i]);
			if(tmpobj[k]==undefined)
				tmpobj[k]=[];
			tmpobj[k].push(s[i]);
		}
	}
//	console.log(tmpobj);
	for(var i in tmpobj){
		tmpobj[i].sort(function(a,b){
			return(getinout(a)-getinout(b));
		});
		retarray.push({'rank':i,'input':tmpobj[i][0],'output':tmpobj[i][tmpobj[i].length-1]});
	}
	console.log('Di'+JSON.stringify(retarray));
	return retarray;
}
exports.main=makepair;
//console.log(makepair(['1.in','1.out']));
//console.log(makepair(['dat1.in','dat1.out']));
//console.log(makepair(['1dat.in','1dat.out']));
//console.log(makepair(['dat.in','dat.out']));
