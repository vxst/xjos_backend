var async=require('async');
var crypto=require('crypto');
var notjson=require('./libjson');//no throw json
exports.main=function(conn,handle,data,sql,callback){
	if(handle==='trylogin'){
		trylogin(conn,data,sql,callback);
	}else if(handle==='tryreg'){
		tryreg(conn.uid,data,sql,callback);
	}else if(handle==='userinfo'){
		userinfo(conn.uid,data,sql,callback);
	}else if(handle==='logout'){
		logout(conn,data,sql,callback);
	}else if(handle==='loginwtoken'){
		loginwtoken(conn,data,sql,callback);
	}
}
function logout(conn,data,sql,callback){
	if(conn.uid!=undefined){
		var uid=parseInt(conn.uid);
		conn.uid=undefined;
		if(uid!=NaN)
			sql.getConnection(function(err,sqlconn){
				sqlconn.query("DELECT FROM xjos.login_token WHERE uid="+sqlconn.escape(uid),function(err,rows){sqlconn.end();});
			});
	}
}
function search(uid,data,sql,callback){
		sql.getConnection(function(err,sqlconn){
			sqlconn.query("SELECT pid,problem_title FROM xjos.problem WHERE pid LIKE CONCAT('%',"+sqlconn.escape(data)+",'%') OR LOWER(problem_title) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR LOWER(problem_description) LIKE CONCAT('%',LOWER("+sqlconn.escape(data)+"),'%') OR pid IN (SELECT problem_group_tag.pid FROM problem_group_tag WHERE problem_group_id IN(SELECT problem_group_id FROM problem_group WHERE LOWER(problem_group_content)=LOWER("+sqlconn.escape(data)+")))",function(err,rows){
				callback(JSON.stringify(rows));
				sqlconn.end();
			});
		});
}
function loginwtoken(conn,data,sql,callback){
	var mytoken=data;
	var myip=conn.remoteAddress;
	if(mytoken.length!=16)return;

	sql.getConnection(function(err,sqlconn){
		sqlconn.query('SELECT uid FROM xjos.login_token WHERE ip='+sqlconn.escape(myip)+' AND token='+sqlconn.escape(mytoken)+'AND expire>NOW()',
		function(err,rows){
			if(rows.length>=1){
				conn.uid=rows[0].uid;
				callback('ok');
			}else{
				callback('nya~');
			}
			sqlconn.end();
		}
		);
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
				if(err){
					callback('ERR');
					console.log('SQL Error');
					return;
				}
				sqlconn.query("SELECT uid,password,password_salt FROM xjos.user WHERE username="+sqlconn.escape(saneobj.username),function(err,rows){
					if(rows.length!=1){
						sqlconn.end();
						callback("USER_PASSWORD_NOT_MATCH",null);//DO NOT SHOW WHETHER USER EXIST
						return;
					}
					var salt=rows[0]['password_salt'],pwd=rows[0]['password'],uid=rows[0]['uid'];
					sqlconn.end();
					verifykey(saneobj.password,salt,function(dk){callback(null,uid,pwd,dk);});
				});
			});
		},
		function(uid,pass,dpass,callback){
			if(pass==dpass){
				gentoken(uid,conn.remoteAddress,sql,function(token){callback(null,token);});
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

function userinfo(uid,data,sql,cb){
	if(uid==undefined||uid==0){
		cb("Must Login");
		return;
	}
	sql.getConnection(function(err,sqlconn){
		sqlconn.query("SELECT uid,email,username,realname,nickname,birthday,icon,gold,silver,rating,level,exp,sign FROM xjos.user WHERE uid="+sqlconn.escape(uid),
		function(err,rows){
			cb(JSON.stringify(rows[0]));
			sqlconn.end();
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
			sqlconn.query('INSERT INTO xjos.user (username,password,password_salt) VALUES('+sqlconn.escape(username)+','+sqlconn.escape(password)+','+sqlconn.escape(password_salt)+')',function(err,rows){
				sqlconn.end();
				callback(null,err);
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
			crypto.pbkdf2(password, salt, 320, 9, function(err,dk){callback(null,salt,dk);});
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
function gentoken(uid,ip,sql,cb){
	async.waterfall([
		function(callback){
			sql.getConnection(
			function(err,sqlconn){
				sqlconn.query("DELETE FROM xjos.login_token WHERE uid="+sqlconn.escape(uid),function(err,rows){
					if(err)
						console.log('Remove login token error:'+err);
					sqlconn.end();
					callback();
				});
			}
			);
		},
		function(callback){
			crypto.pseudoRandomBytes(8,function(ex,buf){callback(null,buf.toString('hex'));});
		},
		function(token,callback){
			sql.getConnection(
			function(err,sqlconn){
				sqlconn.query("INSERT INTO xjos.login_token (expire,uid,ip,token) VALUES (NOW()+INTERVAL 8 HOUR,"+sqlconn.escape(uid)+","+sqlconn.escape(ip)+','+sqlconn.escape(token)+')',function(err,rows){
					sqlconn.end();
					callback(null,token);
				});
			});
		}],
		function(err,token){
			cb(token);
		}
	);
}
function verifykey(password,ssalt,cb){
	var salt=new Buffer(ssalt,'base64');
	//console.log(ssalt);
	//console.log(salt);
	async.waterfall([
		function(callback){
			crypto.pbkdf2(password, salt, 320, 9, function(err,dk){callback(null,dk);});//1700 op/s for 320
		},
		function(dk,callback){
			var strdk=dk.toString('base64');
			callback(null,strdk);
		}],
	function(err,dk){
		cb(dk);
	});
}

