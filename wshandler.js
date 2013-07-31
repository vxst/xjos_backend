var zlib=require('zlib');
var srvlog=require('./lib/log').srvlog;
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
handle['postreg']=require('./std/postreg').main;
handle['problemsample']=require('./std/problemsample').main;
handle['user']=require('./std/user').main;
handle['discuss']=require('./std/discuss').main;
handle['special']=require('./std/special').main;
handle['news']=require('./std/news').main;
handle['app']=require('./std/app').main;
handle['xjfs']=require('./std/xjfs').main;

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
		srvlog('B','WSString Check Error');
		return false;
	}
	return true;
}
exports.handle=function(wsbin,conn,mysql,eventbus){
		try{
			var buffer=wsbin;
			zlib.inflateRaw(buffer,function(err,newbuf){
				if(err){
					console.log(err);
					return;
				}
				var kstr=newbuf.toString('utf8');
				dohandle(kstr,conn,mysql,eventbus);
			});
		}catch(e){
			console.log(e);
		}
//	}
}
function deflatesend(str,conn){
	zlib.deflateRaw(new Buffer(str,'utf8'),function(err,newbuf){
		if(err){
			console.log(err);
			return;
		}
		conn.send(newbuf);
	});
}
var dohandle=function(wsstr,conn,mysql,eventbus){
		srvlog('D','IP:'+conn.ip+' Order:'+wsstr);
		/*if(!checkstr(wsstr)&&wsstr!=="Thank you for accepting me"){
			srvlog('B','Unknown WS Order:'+wsstr+' IP:'+conn.ip);
			conn.send("UNDEF_STRING_ERROR");
			return;
		}*/
		if(wsstr==='Thank you for accepting me')return;
		var tobj=null;
		try{
			tobj=JSON.parse(wsstr);
			if(tobj['order']==undefined||tobj['id']==undefined)return;
			if(typeof(tobj['order'])!='string'||typeof(tobj['id'])!='string')return;
		}catch(e){
			srvlog('B','WS Handler Error:Json Format Error:'+e+':'+wsstr+' IP:'+conn.ip);
			return;
		}
		var h=tobj.order.split('.',2);
		
		if(h[0]==undefined||h[1]==undefined){			
			deflatesend(t[0]+'_@failed_XJPipeline Error:Happy Birthday!',conn);
			srvlog('B','Websocket Handler Error:'+wsstr+' IP:'+conn.ip);
			return;
		}
//		if(t[0]==undefined||h[0]==undefined||h[1]==undefined){			
			//conn.sendUTF(t[0]+'_@failed_XJPipeline Error:Happy Birthday!');
//			deflatesend(t[0]+'_@failed_XJPipeline Error:Happy Birthday!',conn);
//			console.log('ERR:WSHANDLER:'+wsstr);
//			srvlog('B','Websocket Handler Error:'+wsstr+' IP:'+conn.ip);
//			return;
//		}
		var dt=tobj.order.substr(h[0].length+1+h[1].length+1);
//		console.log('Handle '+h[0]+' Fired');
		if(handle[h[0]]===undefined){
			srvlog('B','Undefined Handle Error:'+wsstr+' IP:'+conn.ip);
			deflatesend(tobj.id+'_@failed_XJPipeline Error:Handle Of Service '+h[0]+' is undefined.',conn);
		}else{
	//		console.log("FH:"+h[0]);
			handle[h[0]](conn,h[1],dt,mysql,function(id,tn,order){
				return function(res){
					if((new Date()).getTime()-tn>100){
						srvlog('A','ExtrSlow Query:'+order+' Time:'+((new Date()).getTime()-tn));
					}else
					if((new Date()).getTime()-tn>50){
						srvlog('B','Slow Query:'+order+' Time:'+((new Date()).getTime()-tn));
					}else
					if((new Date()).getTime()-tn>25){
						srvlog('C','Notfast Query:'+order+' Time:'+((new Date()).getTime()-tn));
					}
					deflatesend(JSON.stringify({'id':id,'data':res}),conn);
				}
			}(tobj.id,(new Date()).getTime(),tobj.order),eventbus);
		}
//	}catch(e){
//		console.log('Error!-'+JSON.stringify(e));
//	}
}
/*exports.binhandle=function(wsmsg,conn,mysql,eventbus){
	var k=0;
**	if(wsmsg.length<1){
		conn.sendUTF('BIN DATA FORMAT ERROR');
	}
	var k=wsmsg.readUInt8(0);
	if(conn.bin_arg[k]==undefined){
		conn.sendUTF('BIN DATA IHANDLER ERROR');
		return;
	}
	if(binhandle[conn.bin_arg[k].handler]==undefined){
		conn.sendUTF('BIN DATA HANDLER ERROR');
		return;
	}**
	if(conn.bin_arg==undefined){
		console.log('ERR:BANANAS');
		return;
	}
	if(conn.bin_arg[k]==undefined){
		console.log('ERR:ASAA');
		return;
	}
	if(bhandle[conn.bin_arg[k].handler]==undefined){
		console.log("ERR:APPLE:"+JSON.stringify(conn.bin_arg[k]));
		return;
	}
	bhandle[conn.bin_arg[k].handler](conn.uid,conn.bin_arg[k].order,conn.bin_arg[k].data,wsmsg,mysql,function(){
		conn.sendUTF('BIN_'+k+'_ok');
	});
}*/
