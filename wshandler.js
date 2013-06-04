var bhandle={};
bhandle['upload']=require('./std/file').bin;
var handle={};
handle['time']=require('./std/time').gettime;
handle['taskbar']=require('./std/taskbar').main;
handle['problemindex']=require('./std/problemindex').main;
handle['problemview']=require('./std/problemview').main;
handle['submit']=require('./std/submit').main;
handle['login']=require('./std/login').main;
handle['record']=require('./std/record').main;
handle['upload']=require('./std/file').main;
handle['ptag']=require('./std/problemktag').main;
handle['pedit']=require('./std/problemedit').main;
handle['problemdata']=require('./std/problemdata').main;
handle['contest']=require('./std/contest').main;

handle['regbin']=function(conn,order,data,mysql,cb){
	if(conn.uid==undefined){
		conn.send('Nothing to reg for unreged user');
		return;
	}
	if(order==='reg'){
		var req;
		try{
			req=JSON.parse(data);
		}catch(e){
			cb('JSON FORMAT ERROR');
			return;
		}
		if(typeof(req)!='object'){
			cb('JSON FORMAT ERROR');
			return;
		}
		if(typeof(req.handler)!='string'||typeof(req.order)!='string'||typeof(req.data)!='string'){
			cb('JSON FORMAT ERROR');
		}
		conn.bin_ct++;
		if(conn.bin_ct==256)
			conn.bin_ct=0;
		if(conn,bin_arg[bin_ct]!=undefined){
			cb('ST-Secure-System:Reg Limit Exceed');
		}
		conn.bin_arg[bin_ct].order=req.order;
		conn.bin_arg[bin_ct].data=req.data;
		cb(conn.bin_ct);
	}
	if(order==='dereg'){
		var regk=parseInt(data);
		if(data==NaN){
			cb('Format Error');
		}
		conn.bin_arg[regk]=undefined;
		cb('ok');
	}
}
function checkstr(wsstr){
	var _counterz=-1,_counterp=0;
	for(var i=0;i<wsstr.length;i++)
		if(wsstr[i]=='_'){
			_counterz=i;
			break;
		}
	if(_counterz<1){
		return false;//0 is false too!
	}
	for(var i=_counterz;i<wsstr.length;i++)
		if(wsstr[i]=='.')
			_counterp++;
	if(_counterp<2){
		console.log('E:'+_counterp);
		return false;
	}
//	console.log("T_T"+_counterz+"+"+_counterp);
	return true;
}
exports.handle=function(wsstr,conn,mysql,eventbus){
//	try{
		if(!checkstr(wsstr)&&wsstr!="Thank you for accepting me"){
			console.log(wsstr);
			conn.send("UNDEF_STRING_ERROR");
			return;
		}
		var t=wsstr.split('_',2);
		if(t[1]===undefined)return;
		var h=t[1].split('.',2);
		var dt=wsstr.substr(t[0].length+1+h[0].length+1+h[1].length+1);
		if(handle[h[0]]===undefined){
			conn.sendUTF(t[0]+'_@failed_XJPipeline Error:Handle Of Service '+h[0]+' is undefined.');
		}else{
	//		console.log("FH:"+h[0]);
			handle[h[0]](conn,h[1],dt,mysql,function(res){
				conn.sendUTF(t[0]+'_'+t[1]+'_'+res);
			},eventbus);
		}
//	}catch(e){
//		console.log('Error!-'+JSON.stringify(e));
//	}
}
exports.binhandle=function(wsmsg,conn,mysql,eventbus){
	if(wsmsg.length<1){
		conn.sendUTF('BIN DATA FORMAT ERROR');
	}
	var k=wsmsg[0].readUInt8(0);
	if(conn.bin_arg[k]==undefined){
		conn.sendUTF('BIN DATA IHANDLER ERROR');
		return;
	}
	if(binhandle[conn.bin_arg[k].handler]==undefined){
		conn.sendUTF('BIN DATA HANDLER ERROR');
		return;
	}
	binhandle[conn.bin_arg[k].handler](conn.uid,conn.bin_arg[k].order,conn.bin_arg[k].data,wsmsg.split(1),mysql,function(){
		conn.sendUTF('BIN_'+k+'_ok');
	});
}
