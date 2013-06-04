var async=require('async');
var crypto=require('crypto');
var notjson=require('./libjson');//no throw json
exports.main=function(conn,handle,data,sql,callback){
	if(typeof(conn.uid)=='undefined'){
		callback('Must Login');
		return;
	}
	if(typeof(conn.st_lasteventpool)==undefined){
		conn.st_lasteventpool=(new Date()).getTime();
	}else{
		var now=(new Date()).getTime();
		if(now-conn.st_lasteventpool<60000){
			callback('Orz');
			return;
		}else{
			conn.st_lasteventpool=now;
		}
	}
	if(handle==='addcommonevent'){
		addcommonevent(conn.uid,data,sql,callback);
	}/*else if(handle==='tryreg'){
		tryreg(conn.uid,data,sql,callback);
	}*/
}
function addcommonevent(uid,data,sql,callback){
}
function search(uid,data,sql,callback){
		sql.getConnection(function(err,sqlconn){
			sqlconn.query("SELECT pid,problem_title FROM xjos.problem WHERE pid LIKE CONCAT('%',"+sqlconn.escape(data)+",'%') OR LOWER(problem_title) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR LOWER(problem_description) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR pid IN (SELECT problem_group_tag.pid FROM problem_group_tag WHERE problem_group_id IN(SELECT problem_group_id FROM problem_group WHERE LOWER(problem_group_content)=LOWER("+sqlconn.escape(data)+")))",function(err,rows){
				callback(JSON.stringify(rows));
				sqlconn.end();
			});
		});
}
function trylogin(conn,data,sql,callback){
	async.waterfall([
		function(callback){
			var x=notjson.parse(data);
			if(x===null)
				callback("JSON_CHECK_FAILED",null);
			else if(typeof(x)!='object')
				callback("JSON_OBJ_CHECK_FAILEDA",null);
			else if(typeof(x.password)!='string'||typeof(x.username)!='string')
				callback("JSON_OBJ_CHECK_FAILEDB",null);
			else
				callback(null,x);
		},
		function(saneobj,callback){
			sql.getConnection(function(err,sqlconn){
				sqlconn.query("SELECT uid,password,password_salt FROM xjos.user WHERE username="+sqlconn.escape(saneobj.username),function(err,rows){
					if(rows.length!=1){
						sqlconn.end();
						callback("USER_PASSWORD_NOT_MATCH",null);//DO NOT SHOW WHETHER USER EXIST
					}
					var salt=rows[0]['password_salt'],pwd=rows[0]['password'],uid=rows[0]['uid'];
					sqlconn.end();
					verifykey(saneobj.password,salt,function(dk){callback(null,uid,pwd,dk);});
				});
			});
		},
		function(uid,pass,dpass,callback){
			if(pass==dpass){
				conn.uid=uid;
				callback(null,'SUCCESS');
			}else{
				callback('USER_PASSWORD_NOT_MATCH',null);
			}
		}],
		function(err,info){
			if(err!==null)
				callback(err);
			else
				callback(info);
		});
}

function checkisreg(username,sql,cb){
	sql.getConnection(function(err,sqlconn){	
		sqlconn.query("SELECT uid FROM xjos.user WHERE username="+sqlconn.escape(username),
		function(err,rows){
			if(rows.length!=0){
				sqlconn.end();
				cb(true);
				return;
			}else if(rows.length==0){
				sqlconn.end();
				cb(false);
				return;
			}
		});
	});
}

function tryreg(uid,data,sql,callback){
	async.waterfall([
		function(callback){
			var x=notjson.parse(data);
			if(x===null)
				callback("JSON_CHECK_FAILED",null);
			else if(typeof(x)!='object')
				callback("JSON_OBJ_CHECK_FAILEDA",null);
			else if(typeof(x.password)!='string'||typeof(x.username)!='string')
				callback("JSON_OBJ_CHECK_FAILEDB",null);
			else
				callback(null,x);
		},
		function(saneobj,callback){
			checkisreg(saneobj.username,sql,
			function(isreg){
				if(isreg){
					callback("ERR_USER_REGED",null);
				}else{
					callback(null,saneobj.username,saneobj.password);
				}
			});
		},
		function(username,password,callback){
			genkey(password,function(ps,pd){callback(null,username,pd,ps);});
		},
		function(username,password,password_salt,callback){
			sql.getConnection(function(err,sqlconn){
				sqlconn.query("INSERT INTO xjos.user ('username','password','password_salt) ('"+sqlconn.escape(username)+"','"+sqlconn.escape(password)+"','"+sqlconn.escape(password_salt)+")",function(err,rows){
					sqlconn.end();
					callback(null,"SUCCESS");
				});
			});
		}],
	function(err,info){
		if(err!=null){
			callback(err);
		}else{
			callback(info);
		}
	});
}

function genkey(password,cb){
	async.waterfall([
		function(callback){
			crypto.pseudoRandomBytes(3,function(ex,buf){callback(null,buf)});
		},
		function(salt,callback){
			crypto.pbkdf2(password, salt, 10000, 9, function(err,dk){callback(null,salt,dk);});
		},
		function(salt,dk,callback){
			var strsalt=salt.toString('base64');
			var strdk=dk.toString('base64');
			callback(null,strsalt,strdk);
		}],
		function(err,salt,dk){
			cb(salt,dk);
		});
}
function verifykey(password,ssalt,cb){
	var salt=new Buffer(ssalt,'base64');
	//console.log(ssalt);
	//console.log(salt);
	async.waterfall([
		function(callback){
			crypto.pbkdf2(password, salt, 10000, 9, function(err,dk){callback(null,dk);});
		},
		function(dk,callback){
			var strdk=dk.toString('base64');
			callback(null,strdk);
		}],
	function(err,dk){
		cb(dk);
	});
}

