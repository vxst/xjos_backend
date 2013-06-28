var isok=require('../lib/isok').isok;
var async=require('async');
var filter=require('./filter').htmlfilter;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'view_forum',sql,
	function(ct){
		if(ct==0)return;
		if(handle==='gettopics'){
			gettopics(conn.uid,data,sql,callback);
		}else if(handle==='addtopic'){
			addtopic(conn.uid,data,sql,callback);
		}
	});
}
function gettopics(uid,data,sql,callback){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT tid,title,content,user.uid,username,date,lastreplytime FROM xjos.discuss_topics JOIN xjos.user ON user.uid=discuss_topics.uid WHERE grandfathertid=0 ORDER BY lastreplytime DESC',function(err,rows){
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
					console.log(err);
					callback('err');
				}else{
					callback('ok');
				}
			});
		}else{
			if(intobj.fatherid==undefined){
				console.log('T_T');
				return;
			}
			async.waterfall([
			function(callback){
				sql.getConnection(callback);
			},
			function(sqlc,callback){
				sqlc.query('SELECT MAX(rank) AS mr FROM xjos.discuss_topics WHERE grandfatherid='+sqlc.escape(intobj.grandfatherid),
				function(err,rows){
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
					callback(err,sqlc);
					sqlc.end();
				});
			}],
			function(err){
				if(err){
					console.log(err);
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
