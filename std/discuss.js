var isok=require('../lib/isok').isok;
var async=require('async');
var filter=require('./filter').htmlfilter;
var srvlog=require('../lib/log').srvlog;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'view_forum',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='gettopics'){
			gettopics(conn.uid,data,sql,callback);
		}else if(handle==='addtopic'){
			addtopic(conn.uid,data,sql,callback);
		}else if(handle==='gettopic'){
			gettopic(conn.uid,data,sql,callback);
		}else if(handle==='listboard'){
			listboard(conn.uid,data,sql,callback);
		}else if(handle==='getboard'){
			getboard(conn.uid,data,sql,callback);
		}
	});
	isok(conn.uid,'manage_forum',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='addboard'){
			addboard(conn.uid,data,sql,callback);
		}else if(handle==='delboard'){
			delboard(conn.uid,data,sql,callback);
		}else if(handle==='editboard'){
			editboard(conn.uid,data,sql,callback);
		}
	});
}
function mkretstr(err,msg,me){
	var retobj={};
	if(err){
		srvlog('A','discuss.'+me+'.ERROR:'+err);
		retobj['status']='err';
	}else{
		retobj['status']='ok';
	}
	retobj['data']=msg;		
}
function delboard(uid,data,sql,callback){
	if(isNaN(parseInt(data)))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('DELETE FROM xjos.discuss_board WHERE bdid='+sqlc.escape(parseInt(data)),function(err,rows){
			if(err){sqlc.end();callback(err);}
			else callback(err,'finished');
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'delboard'));
	});
}
function getboard(uid,data,sql,callback){
	if(isNaN(parseInt(data)))return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT * FROM xjos.discuss_board WHERE bdid='+sqlc.escape(parseInt(data)),function(err,rows){
			if(err){sqlc.end();callback(err);}
			else if(rows.length<1){callback('No such board','No such board');}
			else callback(err,sqlc,rows[0]);
		});
	},
	function(sqlc,bdobj){
		sqlc.query('SELECT * FROM xjos.discuss_topics WHERE bdid='+sqlc.escape(parseInt(data)),function(err,rows){
			if(err){sqlc.end();callback(err);}
			else{
				bdobj.topics=rows;
				sqlc.end();
				callback(err,bdobj);
			}
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'getboard'));
	});
}
function editboard(uid,data,sql,callback){
	var sobj={},bdid;
	try{
		var tobj=JSON.parse(data);
		sobj={'fabdid':tobj.fatherBdid,'name':tobj.name,'description':tobj.description};
		bdid=tobj.bdid;
		if(sobj.fabdid==undefined)sobj.fabdid=0;
	}catch(e){
		callback(mkretstr(e,'JSON Error','addboard'));
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('UPDATE xjos.discuss_board SET '+sqlc.escape(sobj)+' WHERE bdid='+sqlc.escape(bdid),function(err,rows){
			sqlc.end();
			callback(err,'finished');
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'editboard'));
	});
}
function addboard(uid,data,sql,callback){
	var sobj={};
	try{
		var tobj=JSON.parse(data);
		sobj={'fabdid':tobj.fatherBdid,'name':tobj.name,'description':tobj.description};
		if(sobj.fabdid==undefined)sobj.fabdid=0;
	}catch(e){
		callback(mkretstr(e,'JSON Error','addboard'));
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('INSERT INTO xjos.discuss_board SET '+sqlc.escape(sobj),function(err,rows){
			sqlc.end();
			callback(err,'finished');
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'listboard'));
	});
}
function listboard(uid,data,sql,callback){
	if(data!='all')return;
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT * FROM xjos.discuss_board',function(err,rows){
			sqlc.end();
			callback(err,rows);
		});
	}],
	function(err,msg){
		callback(mkretstr(err,msg,'listboard'));
	});
}
function gettopic(uid,data,sql,callback){
	var tid=null;
	try{
		tid=JSON.parse(data).tid;
	}catch(e){
		console.log('DGTE'+e);
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT tid,title,content,user.uid,username,date,rank,isnews FROM xjos.discuss_topics JOIN xjos.user ON user.uid=discuss_topics.uid WHERE grandfathertid='+sqlc.escape(tid)+' OR tid='+sqlc.escape(tid)+' ORDER BY rank',function(err,rows){
			callback(err,rows);
			sqlc.end();
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			console.log('Discuss.GetTopic:ERR:'+err);
	});
}
function gettopics(uid,data,sql,callback){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT tid,title,content,user.uid,username,date,lastreplytime,isnews FROM xjos.discuss_topics JOIN xjos.user ON user.uid=discuss_topics.uid WHERE grandfathertid=0 ORDER BY lastreplytime DESC',function(err,rows){
			callback(err,rows);
			sqlc.end();
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			console.log('GetTopics Error:'+err);
	});
}
function addtopic(uid,data,sql,callback){
	var intobj={};
	try{
		var k=JSON.parse(data);
		if(k.content.length>32768){callback('Content too long');return;}
		if(k.title.length>32){callback('Title too long');return;}
		intobj={'title':k.title,'uid':uid,'content':filter(k.content),'date':new Date(),'fathertid':k.fatherid,'grandfathertid':k.grandfatherid,'lastreplytime':new Date(),'privuuid':'','rank':0};
		if(intobj.grandfathertid==undefined){
			console.log('Add topic');
			intobj.grandfathertid=0;
			intobj.fathertid=0;
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				sqlc.query('INSERT INTO xjos.discuss_topics SET '+sqlc.escape(intobj),
				function(err,rows){
					callback(err,sqlc);
					sqlc.end();
				});
			}],
			function(err){
				if(err){
					console.log('Discuss.AddTopic:ERR:'+err);
					callback('err');
				}else{
					callback('ok');
				}
			});
		}else{
			console.log('Add reply topic');
			if(intobj.fathertid==undefined){
				console.log('T_T');
				return;
			}
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				sqlc.query('SELECT MAX(rank) AS mr FROM xjos.discuss_topics WHERE grandfathertid='+sqlc.escape(intobj.grandfathertid),
				function(err,rows){
					if(err){
						sqlc.end();
						callback(err);
						return;
					}
					callback(err,sqlc,rows[0].mr);
				});
			},
			function(sqlc,maxrank,callback){
				intobj.rank=maxrank+1;
				callback(null,sqlc);
			},
			function(sqlc,callback){
				sqlc.query('UPDATE xjos.discuss_topics SET lastreplytime='+sqlc.escape(new Date())+' WHERE tid='+sqlc.escape(intobj.fatherid),
				function(err,rows){
					callback(err,sqlc);
				});
			},
			function(sqlc,callback){
				sqlc.query('INSERT INTO xjos.discuss_topics SET '+sqlc.escape(intobj),
				function(err,rows){
					callback(err);
					sqlc.end();
				});
			}],
			function(err){
				if(err){
					console.log('Discuss.AddTopic.ERR2:'+err);
					callback('err');
				}else{
					callback('ok');
				}
			});
		}
	}catch(e){
		console.log(e);
	}
}
