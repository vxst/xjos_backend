var isok=require('../lib/isok').isok;
var async=require('async');
var filter=require('./filter').htmlfilter;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'edit_news',sql,
	function(ct){
		if(ct==0)return;
		else if(handle==='addtopic'){
			addtopic(conn.uid,data,sql,callback);
		}
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
			intobj.isnews=1;
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
