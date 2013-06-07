var async=require('async');
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(handle==='search'){
		search(conn.uid,data,sql,callback);
	}else if(handle==='recommend'){
		recommend(conn.uid,data,sql,callback);
	}else if(handle==='levelt'){
		getlevel(conn.uid,data,sql,callback);
	}else if(handle==='all'){
		all(conn.uid,data,sql,callback);
	}
}

function fakerows(rows){
for(var i=0;i<rows.length;i++){
var tot=null;
if(Math.random()>0.2){
tot=100;
}else if(Math.random()>0.5){
tot=200;
}else{
tot=150;
}
var tle=Math.random()*0.15,mle=Math.random()*0.15;
var re=Math.random()*0.15;
var wa=Math.random()*0.15;
var spje=Math.random()*0.1;
var blank=Math.random()*0.1;
if(Math.random()<0.2){
blank=1;
re=mle=tle=wa=spje=0;
}else
if(Math.random()>0.01){
blank=0;
}
if(Math.random()>0.2)
spje=0;
if(Math.random()>0.2)
re=0;
if(Math.random()>0.2)
tle=0;
if(Math.random()>0.2)
mle=0;
if(Math.random()>0.2)
wa=0;
rows[i].re=Math.floor(re*tot);
rows[i].mle=Math.floor(mle*tot);
rows[i].tle=Math.floor(tle*tot);
rows[i].wa=Math.floor(wa*tot);
rows[i].spje=Math.floor(spje*tot);
rows[i].blank=Math.floor(blank*tot);
rows[i].ac=tot-rows[i].re-rows[i].mle-rows[i].tle-rows[i].wa-rows[i].spje-rows[i].blank;
}
}
function all(uid,data,sql,callback){
	sql.getConnection(function(err,sqlconn){
		sqlconn.query("SELECT pid,problem_title,elo,levelt FROM xjos.problem",function(err,rows){
			callback(JSON.stringify(rows));
			sqlconn.end();
		});
	});
}
function recommend(uid,data,sql,callback){
//	console.log("R_A");
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	sql.getConnection(function(err,sqlconn){
		sqlconn.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem",function(err,rows){
//			console.log("R_B");
//			console.log(JSON.stringify(rows));
//			callback(JSON.stringify(err));
			fakerows(rows);
			callback(JSON.stringify(rows));
			sqlconn.end();
		});
	});
}
function getlevel(uid,data,sql,callback){
	console.log("G_A");
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
	var k=parseInt(data);
	if(k==NaN){
		callback('NumErr');
		return;
	}
	sql.getConnection(function(err,sqlconn){
		sqlconn.query('SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE problem_title!="" AND levelt='+sqlconn.escape(k),function(err,rows){
//			console.log("R_B");
//			console.log(JSON.stringify(rows));
//			callback(JSON.stringify(err));
			fakerows(rows);
			callback(JSON.stringify(rows));
			sqlconn.end();
		});
	});
}
function search(uid,data,sql,callback){
	if(typeof(uid)=='undefined'){
		callback("Must login");
		return;
	}
		var keyobj=null;
		try{
			keyobj=JSON.parse(data);
		}catch(e){
			callback('JSON_CHECK_FAILED');
			return;
		}
		if(keyobj.keyword===undefined||keyobj.start===undefined||keyobj.length===undefined){
			callback('OBJECT_CHECK_FAILED');
			return;
		}
		sql.getConnection(function(err,sqlconn){
			var data=keyobj.keyword;
//			console.log(JSON.stringify(keyobj));
//			console.log("SELECT pid,problem_title,levelt FROM xjos.problem WHERE pid ="+data+" OR LOWER(problem_title) LIKE CONCAT('%',LOWER('"+data+"'),'%') OR LOWER(problem_description) LIKE CONCAT('%',LOWER('"+data+"'),'%') OR pid IN (SELECT problem_group_tag.pid FROM xjos.problem_group_tag WHERE problem_group_id IN(SELECT problem_group_id FROM xjos.problem_group WHERE LOWER(problem_group_content)=LOWER('"+data+"')))"+"LIMIT "+keyobj.start+","+keyobj.length);
			if(data.length>0){
				var kii="SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE pid ="+sqlconn.escape(data)+" OR LOWER(problem_title) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR LOWER(problem_description) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR pid IN (SELECT problem_group_tag.pid FROM xjos.problem_group_tag WHERE problem_group_id IN(SELECT problem_group_id FROM xjos.problem_group WHERE LOWER(problem_group_content)=LOWER("+sqlconn.escape(data)+")))"+"LIMIT "+sqlconn.escape(keyobj.start)+","+sqlconn.escape(keyobj.length);
				console.log(kii);
				sqlconn.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem WHERE pid ="+sqlconn.escape(data)+" OR LOWER(problem_title) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR LOWER(problem_description) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR pid IN (SELECT problem_group_tag.pid FROM xjos.problem_group_tag WHERE problem_group_id IN(SELECT problem_group_id FROM xjos.problem_group WHERE LOWER(problem_group_content)=LOWER("+sqlconn.escape(data)+")))"+"LIMIT "+sqlconn.escape(keyobj.start)+","+sqlconn.escape(keyobj.length),function(err,rows){
//				callback(JSON.stringify(err));
				fakerows(rows);
				callback(JSON.stringify(rows));
				sqlconn.end();
			});}
			else
				sqlconn.query("SELECT pid,problem_title,levelt,elo FROM xjos.problem LIMIT "+sqlconn.escape(keyobj.start)+","+sqlconn.escape(keyobj.length),function(err,rows){
//				callback(JSON.stringify(err));
				fakerows(rows);
				callback(JSON.stringify(rows));
				sqlconn.end();
			});
		});
}
