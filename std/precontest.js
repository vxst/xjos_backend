var isok=require('../lib/isok').isok;
var async=require('async');
var srvlog=require('../lib/log').srvlog;
var getlvlc=require('./libuser').getlevelc;
exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'take_precontest',sql,
	function(ct){
		if(ct==0)return;
		else if(handle==='view'){
			view(conn.uid,data,sql,callback);
		}else if(handle==='submit'){
			submit(conn.uid,data,sql,callback);
		}else if(handle==='list'){
			list(conn.uid,data,sql,callback);
		}
	});
	isok(conn.uid,'edit_precontest',sql,
	function(ct){
		if(ct==0)return;
		else if(handle==='add'){//ok
			add(conn.uid,data,sql,callback);
		}else if(handle==='edit'){//ok
			edit(conn.uid,data,sql,callback);
		}else if(handle==='del'){//ok
			del(conn.uid,data,sql,callback);
		}
	});
}
function explaininput(data,me){
	try{
		var tobj=JSON.parse(data);
		if(typeof(data)!='object'){
			srvlog('B',me+' Error in input');
			return null;
		}
		return tobj;
	}catch(e){
		srvlog('B','precontest.'+me+' Error in input');
		return null;
	}
}
function makeoutput(err,res,me){
	var retobj={};
	if(err){
		srvlog('B','precontest.'+me+' Error '+err+' Msg '+res);
		retobj['status']='err';
		retobj['message']=res;
	}else{
		retobj['status']='ok';
		retobj['message']=res;
	}
	return JSON.stringify(retobj);
}
function checkProbInfo(probInfo){
	try{
		var ta=JSON.parse(resultArray);
		if(!Array.isArray(ta)){
			return false;
		}
		for(var i=0;i<ta.length;i++){
			if(typeof(ta[i].type)!='string')
				return false;
			if(typeof(ta[i].value)!='string')
				return false;
		}
	}catch(e){
		return false;
	}
	return true;
}
function checkResultArray(resultArray){
	try{
		var ta=JSON.parse(resultArray);
		if(!Array.isArray(ta)){
			return false;
		}
		for(var i=0;i<ta.length;i++){
			if(!Array.isArray(ta[i].answers))
				return false;
			if(typeof(ta[i].grade)!='number')
				return false;
			if(typeof(ta[i].number)!='number')
				return false;
		}
	}catch(e){
		return false;
	}
	return true;
}
function add(uid,data,sql,callback){
	var sobj=explaininput(data,'add');
	if(sobj==null){callback('Input Error');return;}
	if(sobj.content==undefined||sobj.title==undefined||sobj.startTime==undefined||sobj.endTime==undefined||sobj.resultArray==undefined||sobj.level==undefined){callback('Input Error');return;}
	if(typeof(sobj.title)!='string'){callback('Input Error');return;}
	if(sobj.title.length>=32){callback('Title too long');return;}
	if(!checkResultArray(sobj.resultArray)){callback('Input Error');return;}
	if(!checkProbInfo(sobj.probInfo)){callback('Input Error');return;}
	var iobj={'content':sobj.content,'title':sobj.title,'startTime':sobj.startTime,'endTime':sobj.endTime,'probInfo':sobj.probInfo,'resultArray':sobj.resultArray,'level':sobj.level};
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('INSERT INTO xjos.precontest SET '+sqlc.escape(iobj),function(err,res){
			sqlc.end();
			if(err)
				callback(err,'System Error');
			else
				callback(err,res.insertId);
		});
	}],
	function(err,res){
		callback(makeoutput(err,res,'add'));
	});
}

function edit(uid,data,sql,callback){
	var sobj=explaininput(data,'edit');
	if(sobj==null){callback('Input Error');return;}
	if(isNaN(parseInt(sobj.pcid))){callback('Input Error');return;}
	var iobj={'content':sobj.content,'title':sobj.title,'startTime':sobj.startTime,'endTime':sobj.endTime,'probInfo':sobj.probInfo,'resultArray':sobj.resultArray,'level':sobj.level};
	if(iobj.resultArray!==undefined)
		if(!checkResultArray(sobj.resultArray)){
			callback('Input Error');
			return;
		}
	if(iobj.probInfo!==undefined)
		if(!checkProbInfo(sobj.probInfo)){
			callback('Input Error');
			return;
		}
	var pcid=parseInt(sobj.pcid);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('UPDATE xjos.precontest SET '+sqlc.escape(iobj)+' WHERE pcid='+sqlc.escape(pcid),function(err,res){
			sqlc.end();
			if(err)
				callback(err,'System Error');
			else
				callback(err,'ok');
		});
	}],
	function(err,res){
		callback(makeoutput(err,res,'edit'));
	});
}

function del(uid,data,sql,callback){
	var sobj=explaininput(data,'del');
	if(sobj==null){callback('Input Error');return;}
	if(isNaN(parseInt(sobj.pcid))){callback('Input Error');return;}
	var pcid=parseInt(sobj.pcid);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('DELETE FROM xjos.precontest WHERE pcid='+sqlc.escape(pcid),function(err,res){
			sqlc.end();
			if(err)
				callback(err,'System Error');
			else
				callback(err,'ok');
		});
	}],
	function(err,res){
		callback(makeoutput(err,res,'del'));
	});
}

function submit(uid,data,sql,callback){
	var sobj=explaininput(data);
	if(sobj==null){callback('Input Error');return;}
	if(isNaN(parseInt(sobj.pcid))||!Array.isArray(sobj.answers)){callback('Input Error');return;}
	var pcid=parseInt(sobj.pcid);
	var answers=sobj.answers;

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		getlvlc(uid,sqlc,function(lvl){
			callback(null,sqlc,lvl);
		});
	},
	function(sqlc,lvl,callback){
		sqlc.query('SELECT level,resultArray,(startTime<NOW() AND endTime>NOW()) AS isincontest FROM xjos.precontest WHERE pcid='+sqlc.escape(pcid),function(err,res){
			if(err)
				callback(err,'System Error');
			else if(res.length<1)
				callback('No such contest','No such contest');
			else if(res[0].level<=lvl)
				callback(err,sqlc,JSON.parse(res[0].resultArray),res.isincontest);
			else
				callback('NO PRIV TO SUBMIT PRECONTEST','Miaode, You can\'t do that!');
		});
	},
	function(sqlc,Ranswers,isincontest){
		var Tanswers={};
		result=0;
		for(var i=0;i<answers.length;i++){
			Tanswers[answers[i].number]=answers[i].answer;
		}
		for(var i=0;i<Ranswers.length;i++){
			if(Tanswers[Ranswers[i].number]){
				for(var j=0;j<Ranswers[i].answers.length;j++){
					if(Ranswers[i].answers[j]==answer){
						result+=Ranswers[i].grade;
						break;
					}
				}
			}
		}
		callback(null,sqlc,result,isincontest);
	},
	function(sqlc,grade,isincontest){
		var iobj={'uid':uid,'pcid':pcid,'datetime':new Date(),'answers':JSON.stringify(answers),'isin':isincontest,'grade':grade};
		sqlc.query('INSERT INTO xjos.precontest_submit SET '+sqlc.escape(iobj),function(err,rows){
			if(err)callback(err,'System Error');
			else callback(err,rows.insertId);
		});
	}],
	function(err,res){
		callback(makeoutput(err,res,'edit'));
	});
}
function list(uid,data,sql,callback){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT pcid,title,startTime,endTime,level FROM xjos.precontest',function(err,res){
			sqlc.end();
			if(err)
				callback(err,'System Error');
			else
				callback(err,'ok');
		});
	}],
	function(err,res){
		callback(makeoutput(err,res,'del'));
	});
}
function view(uid,data,sql,callback){
	var sobj=explaininput(data,'view');
	if(sobj==null){callback('Input Error');return;}
	if(isNaN(parseInt(sobj.pcid))){callback('Input Error');return;}
	var pcid=parseInt(sobj.pcid);

	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		getlvlc(uid,sqlc,function(lvl){
			callback(null,sqlc,lvl);
		});
	},
	function(sqlc,lvl,callback){
		sqlc.query('SELECT title,content,probInfo,startTime,endTime,level FROM xjos.precontest WHERE pcid='+sqlc.escape(pcid),function(err,res){
			sqlc.end();
			if(err)
				callback(err,'System Error');
			else if(res.length<1)
				callback('No such contest','No such contest');
			else if(res[0].level<=lvl)
				callback(err,JSON.parse(res[0]));
			else
				callback('NO PRIV TO VIEW PRECONTEST','Miaode, You can\'t do that!');
		});
	}],
	function(err,res){
		callback(makeoutput(err,res,'view'));
	});
}
