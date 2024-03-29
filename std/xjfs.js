var async=require('async'),
    libdb=require('./libdb'),
    srvlog=require('../lib/log').srvlog,
    fs=require('fs'),
    crypto=require('crypto'),
    commonvars=require('../commonvars'),
    libfs=require('../lib/fs');
//dir /root
//file /ffx
//no last / in any case
exports.main=decider;
function decider(conn,handle,data,sql,callback){//if over 10,use array.
	if(conn.uid==null)
		return;
	if(handle==='getcur'){//ok
		getcur(conn,data,sql,callback);
	}else if(handle==='touch'){//ok
		touch(conn,data,sql,callback);
	}else if(handle==='ls'){//ok
		ls(conn,data,sql,callback);
	}else if(handle==='cp'){//ok
		cp(conn,data,sql,callback);
	}else if(handle==='mv'){//ok
		mv(conn,data,sql,callback);
	}else if(handle==='rm'){//ok
		rm(conn,data,sql,callback);
	}else if(handle==='cd'){//ok
		cd(conn,data,sql,callback);
	}else if(handle==='pwd'){//ok
		pwd(conn,data,sql,callback);
	}else if(handle==='mkdir'){//ok
		mkdir(conn,data,sql,callback);
	}else if(handle==='gettotalsize'){//ok
		gettotalsize(conn,data,sql,callback);
	}else if(handle==='gettotalcount'){//ok
		gettotalcount(conn,data,sql,callback);
//	}else if(handle==='getbase64'){//ok
//		getbase64(conn,data,sql,callback);
	}else if(handle==='getplaintext'){//ok
		getplaintext(conn,data,sql,callback);
	}else if(handle==='gethttpsurl'){//e..
		gethttpsurl(conn,data,sql,callback);
	}else if(handle==='postplaintext'){//ok
		postplaintext(conn,data,sql,callback);
//	}else if(handle==='postbase64'){//ok
//		postbase64(conn,data,sql,callback);
	}else if(handle==='posthttpsurl'){
		posthttpsurl(conn,data,sql,callback);
	}else if(handle==='format'){//ok
		format(conn,data,sql,callback);
	}else if(handle==='mkdefault'){
		mkdefault(conn,data,sql,callback);
	}else if(handle==='orderarray'){
		orderarray(conn,data,sql,callback);
	}
}
var limitvars={'maxdirlen':512};

function mkdefault(conn,data,sql,callback){
	async.waterfall([
	function(callback){
		getcur(conn,'',sql,function(val){
			callback(null,JSON.parse(val).data);
		});
	},
	function(cur,callback){
		mkdir(conn,JSON.stringify({'name':'System','cur':cur}),sql,function(val){
			callback(null,cur);
		});
	},
	function(cur,callback){
		mkdir(conn,JSON.stringify({'name':'Documents','cur':cur}),sql,function(val){
			callback(null,cur);
		});
	},
	function(cur,callback){
		mkdir(conn,JSON.stringify({'name':'Programs','cur':cur}),sql,function(val){
			callback(null,cur);
		});
	},
	function(cur,callback){
		mkdir(conn,JSON.stringify({'name':'Muiltmedia','cur':cur}),sql,function(val){
			callback(null,'finished');
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'mkdefault'));
	});
}

function mkrandstr(len,callback){//len bytes of random
	crypto.pseudoRandomBytes(len,function(err,buf){
		callback(err,buf.toString('hex'));
	});
}
function mkrandbase64str(len,callback){
	crypto.pseudoRandomBytes(len,function(err,buf){
		callback(err,buf.toString('base64').replace('+','-').replace('/','_'));
	});
}
/*mkrandbase64str(12,function(err,str){
	console.log(str);
});*/
function mkwarnstr(err,msg,me){
	var retobj={};
	if(err){
		srvlog('C','XJFS.'+me+'Warning: '+err);
		retobj['status']='warning';
	}else{
		retobj['status']='ok';
	}
	retobj['data']=msg;
	return JSON.stringify(retobj);
}
function mkretstr(err,msg,me){
	var retobj={};
	if(err){
		srvlog('B','XJFS.'+me+'Error: '+err);
		retobj['status']='error';
	}else{
		retobj['status']='ok';
	}
	retobj['data']=msg;
	return JSON.stringify(retobj);
}
function getfatherdir(dir){
	if(dir.length==0||dir=='/')return null;
	if(dir[0]!='/')return null;
	var startpos=dir.length-1;
	if(dir[startpos]=='/')startpos--;
	for(var i=startpos;i>=0;i--)
		if(dir[i]=='/')
			return dir.substr(0,i+1);
}
function getplace(dir,reldir){
	if(reldir.length==0)return '/';
	if(reldir[reldir.length-1]=='/'&&reldir.length>1)reldir=reldir.substr(0,reldir.length-1);
	if(reldir.length>limitvars.maxdirlen)return false;
	if(dir.length>limitvars.maxdirlen)return false;
	if(reldir[0]=='/'&&reldir[1]=='/')return false;
	if(reldir[0]=='/')return reldir;


	if(reldir.substr(0,2)=='..')return getplace(getfatherdir(dir),reldir.substr(3));
	if(reldir.substr(0,2)=='.')return getplace(dir,reldir.substr(2));
	if(dir[dir.length-1]!='/')return dir+'/'+reldir;
	if(dir[dir.length-1]=='/')return dir+reldir;
}
var TtestNow=null;
function Ttest(val){
	if(!val){
		console.log('ERROR:'+TtestNow);
	}
}
function Tgetplace(){
	TtestNow='getplace';
	Ttest(getplace('/','system')=='/system');
	Ttest(getplace('/','system/')=='/system');
	Ttest(getplace('/','/system')=='/system');
	Ttest(getplace('/aaa','system')=='/aaa/system');
	Ttest(getplace('/aaa','/system')=='/system');
	Ttest(getplace('/','/system/')=='/system');
}
Tgetplace();
function removexg(name){
	if(name[name.length-1]=='/')return name.substr(0,name.length-1);
	else return name;
}
function getname(dir){
	if(dir.length==0||dir=='/')return null;
	if(dir[0]!='/')return null;
	var startpos=dir.length-1;
	if(dir[startpos]=='/')startpos--;
	for(var i=startpos;i>=0;i--)
		if(dir[i]=='/')
			return removexg(dir.substr(i+1));
	return dir;
}
function checkname(name){
	if(typeof(name)!='string')return false;
	for(var i=0;i<name.length;i++)
		if(name[i]=='/'||name[i]=='*'||name[i]=='?')return false;
	return true;
}
function format(conn,data,sql,callback){
	if(isNaN(parseInt(conn.uid)))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('DELETE FROM xjos.sfs_usrnode WHERE uid='+sqlc.escape(conn.uid),
		function(err,rows){
			if(err){
				callback(err,'Format Error');
				sqlc.end();
			}else callback(err,'Deleting',sqlc);
		});
	},
	function(msg,sqlc,callback){
		var obj={'uid':conn.uid,'dir':'/','filetype':'dir','hash':'','fatherunid':0,'name':'/','metadata':JSON.stringify({'createTime':new Date(),'modifyTime':new Date(),'visitTime':new Date(),'icon':'','text':''})}
		sqlc.query('INSERT INTO xjos.sfs_usrnode SET '+sqlc.escape(obj),function(err,rows){
			sqlc.end();
			if(err)
				callback(err,'Format Error');
			else
				callback(err,'Format OK');
		});
	},
	function(val,callback){
		mkdefault(conn,null,sql,function(str){
			callback(null,val);
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'format'));
	});
}
function getcur(conn,data,sql,callback){
	var retobj={},cur;
	if(conn.dir===undefined)conn.dir={};
	if(conn.dir.nextcur===undefined)conn.dir.nextcur=0;
	if(conn.dir.curarr===undefined)conn.dir.curarr={};
	retobj['curid']=cur=conn.dir.nextcur;
	conn.dir.nextcur++;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT unid FROM xjos.sfs_usrnode WHERE dir="/"',function(err,rows){
			if(err){srvlog('A','SQL Error');sqlc.end();callback(err,'Error');return;}
			else if(rows.length<1){
				callback('Not formated','Not formated yet');
				sqlc.end();
			}else{ 
				conn.dir.curarr[cur]={'dir':'/','unid':rows[0].unid,'lock':false};
				sqlc.end();
				callback(null,cur);
			}
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'GetCur'));
	});
}
function explaininput(data,me){
	var tobj;
	if(typeof(data)!='string')
		return null;
	if(data.length>2048000)
		return null;
	try{
		var pobj=JSON.parse(data);
		tobj={'cur':pobj.cur,'name':pobj.name,'data':pobj.data};
		if(isNaN(tobj.cur))return null;
		return tobj;
	}catch(e){
		srvlog('B','XJFS.'+me+' Error:'+e);
		return null;
	}
	return null;
}
function checkcur(conn,cur){
	if(conn.dir==undefined)return false;
	if(conn.dir.curarr==undefined)return false;
	if(conn.dir.curarr[cur]==undefined)return false;
	if(conn.dir.curarr[cur].lock==true)return false;
	return true;
}
function cd(conn,data,sql,callback){
	var tobj=explaininput(data,'cd');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;
//	if(!checkname(tobj.name))return;

	conn.dir.curarr[tobj['cur']].lock=true;

	if(tobj.name==undefined){
		callback(mkwarnstr('No name','No name, cd /','cd'));
		tobj.name='/';
	}
	var wantplace=getplace(conn.dir.curarr[tobj['cur']].dir,tobj.name);
	if(!wantplace){
		callback(mkretstr('Place name error','Place name err','cd'));
		return;
	}

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT unid FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(wantplace)+' AND filetype="dir" AND uid='+sqlc.escape(conn.uid),
		function(err,rows){
			sqlc.end();
			conn.dir.curarr[tobj['cur']].lock=false;
			if(err)callback(err,'XJFS Error');
			else if(rows.length<1)callback('No such dir','No such dir');
			else{
				conn.dir.curarr[tobj['cur']].dir=wantplace;
				conn.dir.curarr[tobj['cur']].unid=rows[0].unid;
				callback(null,'cd finished');
			}
		});
	}],
	function(err,info){
		callback(mkretstr(err,info,'cd'));
	});
}
function getcurobj(conn,tobj){
	return conn.dir.curarr[tobj['cur']];
}
function copytree(unidfrom,unidto,sqlc,callback){//copy, never end sqlc
	async.waterfall([
	function(callback){
		sqlc.query('SELECT dir FROM xjos.sfs_usrnode WHERE unid='+sqlc.escape(unidto),
		function(err,rows){
			if(err){sqlc.end();callback(err,'XJFS ERR');}
			else if(rows.length==0){
				callback('No such unid');
			}
			callback(err,rows[0].dir);
		});
	},
	function(fadir,callback){
		sqlc.query('SELECT uid,hash,name,size,filetype,metadata FROM xjos.sfs_usrnode WHERE fatherunid='+sqlc.escape(unidfrom),
		function(err,rows){
			if(err){callback(err,'XJFS ERR');}
			async.eachSeris(rows,
			function(row,callback){
				async.waterfall([
				function(callback){
					var insobj={'uid':row.uid,'hash':row.hash,'name':row.name,'size':row.size,'filetype':row.filetype,'metadata':row.metadata,'dir':getplace(fadir,row.name),'fatherunid':unidto};
					sqlc.query('INSERT INTO xjos.sfs_usrnode SET '+sqlc.escape(insobj),
					function(err,rows){
						if(err){callback(err,'XJFS ERR');}
						else callback(err,rows.insertId);
					});
				},
				function(newunid,callback){
					if(row.filetype=='dir'){
						copytree(row.unid,newunid,sqlc,function(err,msg){
							callback(err);
						});
					}else{
						callback();
					}
				}],
				function(err){
					if(err){
						srvlog('B','xjfs.copytree Err:'+err);
					}
					callback(err);
				});
			},
			function(err){
				if(err)
					callback(err,'XJFS ERR');
				else
					callback(err,'ok');
			});
		});
	}],
	function(err,msg){
		callback(err,msg);
	});
}
function removetree(unid,sqlc,callback){//remove, never end sqlc
	async.waterfall([
	function(callback){
		sqlc.query('DELETE FROM xjos.sfs_usrnode WHERE unid='+sqlc.escape(unid),
		function(err,rows){
			if(err){
				callback(err,'XJFS ERR');
			}else if(rows.length==0){
				callback('No such unid');
			}else{
				callback(err,rows[0].dir);
			}
		});
	},
	function(fadir,callback){
		sqlc.query('SELECT unid FROM xjos.sfs_usrnode WHERE fatherunid='+sqlc.escape(unid),
		function(err,rows){
			if(err){
				callback(err,'XJFS ERR');
			}else if(rows.length==0){
				callback(err,'ok');
			}else{
				async.eachSeris(rows,
				function(row,callback){
					removetree(row.unid,sqlc,callback);
				},
				function(err){
					if(err)
						callback(err,'XJFS ERR');
					else
						callback(err,'ok');
				});
			}
		});
	}],
	function(err,msg){
		callback(err,msg);
	});
}
function keepdirorder(unid,sqlc,callback){//move, never end sqlc
	async.waterfall([
	function(callback){
		sqlc.query('SELECT dir FROM xjos.sfs_usrnode WHERE unid='+sqlc.escape(unid),
		function(err,rows){
			if(err){sqlc.end();callback(err,'XJFS ERR');}
			else if(rows.length==0){
				callback('No such unid');
			}
			callback(err,rows[0].dir);
		});
	},
	function(fadir,callback){
		sqlc.query('SELECT unid,name,filetype FROM xjos.sfs_usrnode WHERE fatherunid='+sqlc.escape(unid),
		function(err,rows){
			if(err){callback(err,'XJFS ERR');}
			async.eachSeris(rows,
			function(row,callback){
				async.waterfall([
				function(callback){
					var newdir=getplace(fadir,row.name);
					sqlc.query('UPDATE xjos.sfs_usrnode SET dir='+sqlc.escape(newdir)+' WHERE unid='+sqlc.escape(row.unid),
					function(err,rows){
						if(err){callback(err,'XJFS ERR');}
						else callback(err);
					});
				},
				function(callback){
					if(row.filetype=='dir'){
						keepdirorder(row.unid,sqlc,function(err,msg){
							callback(err);
						});
					}else{
						callback();
					}
				}],
				function(err){
					if(err){
						srvlog('B','xjfs.keepdirorder Err:'+err);
					}
					callback(err);
				});
			},
			function(err){
				if(err)
					callback(err,'XJFS ERR');
				else
					callback(err,'ok');
			});
		});
	}],
	function(err,msg){
		callback(err,msg);
	});
}

function mv(conn,data,sql,callback){
	var tobj=explaininput(data,'mv');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	conn.dir.curarr[tobj['cur']].lock=true;

	var fromdir=getplace(getcurobj(conn,tobj).dir,tobj.name);
	var todir=getplace(getcurobj(conn,tobj).dir,tobj.data);
	var frombase=getfatherdir(fromdir);
	var tobase=getfatherdir(todir);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT unid,uid,hash,size,filetype,metadata FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(fromdir)+' AND uid='+sqlc.escape(conn.uid),
		function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			if(rows.length==0)callback('dir error','XJFS Error:No file');
			else callback(err,sqlc,rows[0],rows[0].unid);
		});
	},
	function(sqlc,fromobj,fromunid,callback){
		sqlc.query('SELECT unid FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(tobase)+' AND filetype="dir" AND uid='+sqlc.escape(conn.uid),function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			if(rows.length==0){callback('dir error','XJFS Error:No dir');return;}
			callback(err,sqlc,fromobj,fromunid,rows[0].unid);
		})
	},
	function(sqlc,fromobj,fromunid,tobaseunid,callback){
		var setobj={'dir':todir,'name':getname(todir),'fatherunid':tobaseunid};

		sqlc.query('UPDATE xjos.sfs_usrnode SET '+sqlc.escape(setobj)+' WHERE unid='+sqlc.escape(fromunid),
		function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			callback(err,sqlc,fromunid,fromunid.filetype);
		});
	},
	function(sqlc,fromunid,filetype,callback){
		if(filetype=='dir'){
			keepdirorder(fromunid,sqlc,function(err,msg){
				sqlc.end();
				callback(err,msg);
			});
		}else{
			callback(null,'move file ok');
		}
	}],
	function(err,info){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,info,'mv'));
	});
}
function cp(conn,data,sql,callback){
	var tobj=explaininput(data,'cp');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	conn.dir.curarr[tobj['cur']].lock=true;

	var fromdir=getplace(getcurobj(conn,tobj).dir,tobj.name);
	var todir=getplace(getcurobj(conn,tobj).dir,tobj.data);
	var frombase=getfatherdir(fromdir);
	var tobase=getfatherdir(todir);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT unid,uid,hash,size,filetype,metadata FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(fromdir)+' AND uid='+sqlc.escape(conn.uid),
		function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			if(rows.length==0)callback('dir error','XJFS Error:No file');
			callback(err,sqlc,rows[0],rows[0].unid);
		});
	},
	function(sqlc,fromobj,fromunid,callback){
		sqlc.query('SELECT unid FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(tobase)+' AND filetype="dir" AND uid='+sqlc.escape(conn.uid),function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			if(rows.length==0)callback('dir error','XJFS Error:No dir');
			callback(err,sqlc,fromobj,fromunid,rows[0].unid);
		});
	},
	function(sqlc,fromobj,fromunid,tobaseunid,callback){
		fromobj.dir=todir;
		fromobj.name=getname(todir);
		fromobj.fatherunid=tobaseunid;
		fromobj.unid=undefined;
		sqlc.query('INSERT INTO xjos.sfs_usrnode SET '+sqlc.escape(fromobj),
		function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			callback(err,sqlc,fromunid,rows.insertId,fromunid.filetype);
		});
	},
	function(sqlc,fromunid,tounid,filetype,callback){
		if(filetype=='dir'){
			copytree(fromunid,tounid,sqlc,function(err,msg){
				sqlc.end();
				callback(err,msg);
			});
		}else{
			callback(null,'copy file ok');
		}
	}],
	function(err,info){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,info,'cp'));
	});
}
function rm(conn,data,sql,callback){
	var tobj=explaininput(data,'rm');
	
	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;
	if(tobj.name==null)return;

	conn.dir.curarr[tobj['cur']].lock=true;

	var nowdir=getplace(getcurobj(conn,tobj).dir,tobj.name);
	
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT unid FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(nowdir)+' AND uid='+sqlc.escape(conn.uid),function(err,rows){
			if(err){callback(err,'XJFS Err');sqlc.end();return;}
			else
			if(rows.length<1){callback('nn!','No such file');return;}
			callback(err,rows[0].unid,sqlc);
		});
	},
	function(unid,sqlc,callback){
		removetree(unid,sqlc,function(err,msg){
			sqlc.end();
			callback(err,msg);
		});
	}],
	function(err,msg){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,msg,'rm'));
	});
}
function ls(conn,data,sql,callback){
	var tobj=explaininput(data,'ls');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	conn.dir.curarr[tobj['cur']].lock=true;

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT name,size,filetype,metadata FROM xjos.sfs_usrnode WHERE fatherunid='+sqlc.escape(conn.dir.curarr[tobj.cur].unid)+' AND uid='+sqlc.escape(conn.uid),
		function(err,rows){
			sqlc.end();
			conn.dir.curarr[tobj['cur']].lock=false;
			if(err)callback(err,'XJFS Error');
			else{
				callback(null,rows);
			}
		});
	}],
	function(err,info){
		callback(mkretstr(err,info,'ls'));
	});
}

function touch(conn,data,sql,callback){
	var tobj=explaininput(data,'touch');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;
	if(!checkname(tobj.name))return;

	conn.dir.curarr[tobj['cur']].lock=true;
	
	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT count(*) AS ct FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(getplace(nowplace,tobj.name))+' AND uid='+sqlc.escape(conn.uid),
		function(err,rows){
			if(err){
				sqlc.end();
				callback(err,'err');
			}else if(rows[0].ct!=0){
				sqlc.end();
				callback('Add file error','file has already exists');
			}else{
				callback(err,sqlc);
			}
		});
	},
	function(sqlc,callback){
		var insobj={'dir':getplace(nowplace,tobj.name),'filetype':'plain','hash':'47DEQpj8HBSa-_TI','uid':conn.uid,'fatherunid':unid,'name':tobj.name,'size':0};
		sqlc.query("INSERT INTO xjos.sfs_usrnode SET "+sqlc.escape(insobj),function(err,row){
			callback(err,'touch finished');
			sqlc.end();
		});
	}],
	function(err,msg){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,msg,'touch'));
	});
}
function pwd(conn,data,sql,callback){
	var tobj=explaininput(data,'pwd');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	callback(mkretstr(null,getcurobj(conn,tobj).dir,'pwd'));
}
function mkdir(conn,data,sql,callback){
	var tobj=explaininput(data,'mkdir');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;
	if(!checkname(tobj.name))return;

	conn.dir.curarr[tobj['cur']].lock=true;
	
	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT count(*) AS ct FROm xjos.sfs_usrnode WHERE dir='+sqlc.escape(getplace(nowplace,tobj.name))+' AND uid='+sqlc.escape(conn.uid),
		function(err,rows){
			if(err){
				sqlc.end();
				callback(err,'err');
			}else if(rows[0].ct!=0){
				sqlc.end();
				callback('Added dir','dir has already exists');
			}else{
				callback(err,sqlc);
			}
		});
	},
	function(sqlc,callback){
		var insobj={'dir':getplace(nowplace,tobj.name),'filetype':'dir','hash':'','uid':conn.uid,'fatherunid':unid,'name':tobj.name,'size':0};
		sqlc.query("INSERT INTO xjos.sfs_usrnode SET "+sqlc.escape(insobj),function(err,row){
			callback(err,'mkdir finished');
			sqlc.end();
		});
	}],
	function(err,msg){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,msg,'mkdir'));
	});
}
function gettotalcount(conn,data,sql,callback){
	var tobj=explaininput(data,'gettotal');

	sql.getConnection(function(err,sqlc){
		if(err){
			srvlog('A','xjfs.gettotalcount:'+err);
			return;
		}
		sqlc.query('SELECT count(*) as totalcount FROM xjos.sfs_usrnode WHERE uid='+sqlc.escape(conn.uid),
		function(err,rows){
			sqlc.end();
			callback(mkretstr(err,rows[0].totalcount,'gettotalcount'));
		});
	});
}
function gettotalsize(conn,data,sql,callback){
	var tobj=explaininput(data,'gettotal');

	sql.getConnection(function(err,sqlc){
		if(err){
			srvlog('A','xjfs.gettotalsize:'+err);
			return;
		}
		sqlc.query('SELECT SUM(size) as totalsize FROM xjos.sfs_usrnode WHERE uid='+sqlc.escape(conn.uid),
		function(err,rows){
			sqlc.end();
			callback(mkretstr(err,rows[0].totalsize,'gettotalsize'));
		});
	});
}
function postplaintext(conn,data,sql,callback){
	var tobj=explaininput(data,'postplaintext');

	if(tobj==null){
		callback(mkretstr('Input error A','Input Error','postplaintext'));
		return;
	}
	if(!checkcur(conn,tobj.cur)){
		callback(mkretstr('Input error B','Input Error','postplaintext'));
		return;
	}
	if(!checkname(tobj.name)){
		callback(mkretstr('Input error C','Input Error','postplaintext'));
		return;
	}
	if(tobj.data==null){
		callback(mkretstr('Input error D','Input Error','postplaintext'));
		return;
	}

	conn.dir.curarr[tobj['cur']].lock=true;

	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;

	async.waterfall([
	function(callback){
		mkrandstr(12,callback);//96 bit of randomness
	},
	function(str,callback){
		var tmpname=commonvars.baseurl+'/xjfsfiles/tmp/'+str;
		console.log(tmpname);
		fs.writeFile(tmpname,tobj.data,function(err){
			callback(err,tmpname);
		});
	},
	function(tmpname,callback){
		fs.stat(tmpname,function(err,stat){
			if(err)callback(err,'XJFS Err');
			else callback(err,tmpname,stat.size);
		});
	},
	function(tmpname,size,callback){
		libfs.renameFile(tmpname,function(err,hash){
			if(err)callback(err,'XJFS Err');
			else callback(err,hash,size);
		});
	},
	function(hash,size,callback){
		sql.getConnection(function(err,sqlc){
			callback(err,sqlc,hash,size);
		});
	},
	function(sqlc,hash,size,callback){
		sqlc.query('DELETE FROM xjos.sfs_usrnode WHERE dir='+sqlc.escape(getplace(nowplace,tobj.name)),
		function(err,rows){
			if(err){
				callback(err,'Failed');
			}else{
				callback(err,sqlc,hash,size);
			}
		});
	},
	function(sqlc,hash,size,callback){
		var insobj={'dir':getplace(nowplace,tobj.name),'filetype':'plain','hash':hash,'uid':conn.uid,'fatherunid':unid,'name':tobj.name,'size':size};
		sqlc.query('INSERT INTO xjos.sfs_usrnode SET '+sqlc.escape(insobj),function(err,rows){
			sqlc.end();
			callback(err);
		});
	}],
	function(err,msg){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,msg,'postplaintext'));
	});
}
function postbase64(conn,data,sql,callback){
	var tobj=explaininput(data,'postbase64');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;
	if(!checkname(tobj.name))return;
	if(tobj.data==null)return;

	conn.dir.curarr[tobj['cur']].lock=true;

	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;

	async.waterfall([
	function(callback){
		mkrandstr(12,callback);//96 bit of randomness
	},
	function(str,callback){
		var tmpname=commonvars.baseurl+'/xjfsfiles/tmp/'+str;
		try{
			fs.writeFile(tmpname,new Buffer(tobj.data,'base64'),function(err){
				callback(tmpname);
			});
		}catch(e){
			callback(e,'Base64 Error');
		}
	},
	function(tmpname,callback){
		fs.stat(tmpname,function(err,stat){
			if(err) callback(err,'XJFS Err');
			else callback(err,tmpname,stat.size);
		});
	},
	function(tmpname,size,callback){
		libfs.renameFile(tmpname,function(err,hash){
			if(err)callback(err,'XJFS Err');
			else callback(err,hash,size);
		});
	},
	function(hash,size,callback){
		sql.getConnection(function(err,sqlc){
			callback(err,sqlc,hash,size);
		});
	},
	function(sqlc,hash,size,callback){
		var insobj={'dir':getplace(nowplace,tobj.name),'filetype':'plain','hash':hash,'uid':conn.uid,'fatherunid':unid,'name':tobj.name,'size':size};
		sqlc.query('INSERT INTO xjos.sfs_usrnode SET '+sqlc.escape(insobj),function(err,rows){
			sqlc.end();
			callback(err);
		});
	}],
	function(err,msg){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,msg,'postbase64'));
	});
}
function getplaintext(conn,data,sql,callback){
	var tobj=explaininput(data,'getplaintext');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	conn.dir.curarr[tobj['cur']].lock=true;

	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT hash FROM xjos.sfs_usrnode WHERE uid='+sqlc.escape(conn.uid)+' AND dir='+sqlc.escape(getplace(nowplace,tobj.name))+' AND size<65536',function(err,rows){
			sqlc.end();
			if(err)callback(err,'XJFS Err');
			else if(rows.length<1)callback('No such file','No such file');
			else callback(err,rows[0].hash);
		});
	},
	function(hash,callback){
		conn.dir.curarr[tobj['cur']].lock=false;
		fs.readFile(commonvars.baseurl+'/xjfsfiles/'+hash.substr(0,2)+'/'+hash,callback);
	}],
	function(err,data){
		callback(mkretstr(err,data.toString(),'getplaintext'));
	});
}
function getbase64(conn,data,sql,callback){
	var tobj=explaininput(data,'getbase64');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	conn.dir.curarr[tobj['cur']].lock=true;

	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT hash FROM xjos.sfs_usrnode WHERE uid='+sqlc.escape(conn.uid)+' AND dir='+sqlc.escape(getplace(nowplace,tobj.name))+' AND size<65536',function(err,rows){
			sqlc.end();
			if(err)callback(err,'XJFS Err');
			else if(rows.length<1)callback('No such file','No such file');
			else callback(err,rows[0].hash);
		});
	},
	function(hash,callback){
		fs.readFile(commonvars.baseurl+'/xjfsfiles/'+hash.substr(0,2)+'/'+hash,callback);
	}],
	function(err,data){
		conn.dir.curarr[tobj['cur']].lock=false;
		callback(mkretstr(err,data.toString('base64'),'getbase64'));
	});
}
function gethttpsurl(conn,data,sql,callback){
	var tobj=explaininput(data,'gethttpsurl');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;
	var expiretime=parseInt(tobj.data);
	if(isNaN(expiretime))expiretime=360000;

	var dir=getplace(nowplace,tobj.name);
	if(!dir)callback(mkretstr(null,'Args Wrong','gethttpsurl'));

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		mkrandbase64str(9,function(err,str){
			callback(err,str,sqlc);
		});
	},
	function(uuid,sqlc,callback){
		sqlc.query('SELECT hash FROM xjos.sfs_usrnode WHERE uid='+sqlc.escape(conn.uid)+' AND dir='+sqlc.escape(dir),function(err,rows){
			if(err){
				callback(err);return;
			}else if(rows.length<1){
				callback('No such row','No such file');
			}else
				callback(err,sqlc,uuid,rows[0].hash);
		});
	},
	function(sqlc,uuid,hash,callback){
		var insobj={'uuid':uuid,'hash':hash,'expire':((new Date()).getTime()+expiretime)};
		sqlc.query('INSERT INTO xjos.gettable SET '+sqlc.escape(insobj),function(err,rows){
			sqlc.end();
			callback(err,commonvars.dynurl+'/XJFSGET/'+uuid);
		});
	}],
	function(err,url){
		callback(mkretstr(err,url,'gethttpsurl'));
	});
}
function posthttpsurl(conn,data,sql,callback){
	var tobj=explaininput(data,'posthttpsurl');

	if(tobj==null)return;
	if(!checkcur(conn,tobj.cur))return;

	var nowplace=conn.dir.curarr[tobj['cur']].dir;
	var unid=conn.dir.curarr[tobj['cur']].unid;
	var expiretime=parseInt(tobj.data);
	if(isNaN(expiretime))expiretime=360000;

	var dir=getplace(nowplace,tobj.name);
	if(!dir)callback(mkretstr('Args Wrong','Args Wrong','posthttpsurl'));

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		mkrandbase64str(9,function(err,str){
			callback(err,sqlc,str);
		});
	},
	function(sqlc,uuid,callback){
		var insobj={'uuid':uuid,'dir':dir,'expire':new Date((new Date()).getTime()+expiretime),'uid':conn.uid,'fauuid':uuid,'name':getname(dir),'metadata':''};
		sqlc.query('INSERT INTO xjos.fsposttable SET '+sqlc.escape(insobj),function(err,rows){
			sqlc.end();
			callback(err,commonvars.dynurl+'/xjfspost/'+uuid);
		});
	}],
	function(err,url){
		callback(mkretstr(err,url,'posthttpsurl'));
	});
}
function orderarray(conn,data,sql,callback){
	var p;
	try{
		p=JSON.parse(data);
		if(!Array.isArray(p)){
			callback(mkerrstr('Format Error','Format Error','orderarray'));
			return;
		}
	}catch(e){
		callback(mkwarnstr('Format Error','Format Error','orderarray'));
		return;
	}
	async.eachSeries(p,
	function(obj,callback){
		if(typeof(obj)!='object'){
			callback(mkerrstr('Format Error','Format Error','orderarray'));
			return;
		}
		if(typeof(obj.order)!='string'||typeof(obj.data)!='string'){
			callback(mkerrstr('Format Error','Format Error','orderarray'));
			return;
		}
		decider(conn,obj.order,obj.data,sql,function(retstr){
			if(JSON.parse(retstr)['status']!='ok'){
				callback(mkretstr('Execute Error','Execute Error At Order '+obj.order,'orderarray'));
			}else{
				callback();
			}
		});
	},
	function(err){
		if(err)
			callback(err);
		else
			callback(mkretstr(null,'All orders is executed and return well.'));
	});
}
