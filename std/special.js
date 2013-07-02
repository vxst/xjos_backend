//Something do not need to login AND Apple Pie!
var async=require('async'),
    libdb=require('./libdb'),
    genkey=require('./libcrypt').genkey;
exports.main=function(conn,handle,data,sql,callback){//if over 10,use array.
	if(handle==='upgradepassword'){
		upgradepassword(conn.uid,data,sql,callback);
	}
}
function upgradepassword(uid,data,sql,callback){
	if(uid!==undefined){
		callback('Must logout');
		return;
	}
	var oldPassword,newPassword,userName;
	try{
		var kobj=JSON.parse(data);
		oldPassword=kobj.oldPassword;
		newPassword=kobj.newPassword;
		userName=kobj.userName;
		if(oldPassword.length!=32||newPassword.length!=32){
			callback('Password Length Error');
			return;
		}
		if(typeof(oldPassword)!='string')return;
		if(typeof(newPassword)!='string')return;
		if(typeof(userName)!='string')return;
	}catch(e){
		console.log(e);
		return;
	}
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,cb){
		sqlc.query('SELECT user.uid,user.password FROM xjos.user JOIN tester.users ON user.olduid=users.uid WHERE users.pass='+sqlc.escape(oldPassword)+' AND user.username='+sqlc.escape(userName),function(err,rows){
			if(err){
				cb(err);
				return;
			}
			if(rows.length<1)
				cb('upgradePassword:Password wrong');
			else if(rows[0].password!='NOT_SET'){
				callback('大你一顿');
				cb('Already changed password');
			}else
				cb(err,sqlc,rows[0].uid);
		});
	},
	function(sqlc,uid,callback){
		genkey(newPassword,function(salt,key){
			callback(null,sqlc,uid,salt,key);
		});
	},
	function(sqlc,uid,salt,key,callback){
		console.log(key);
		console.log(salt);
		sqlc.query('UPDATE xjos.user SET password='+sqlc.escape(key)+' ,password_salt='+sqlc.escape(salt)+' WHERE uid='+sqlc.escape(uid),
		function(err,rows){
			callback(err,sqlc,uid);
		});
	},
	function(sqlc,uid,callback){
		sqlc.query('DELETE FROM xjos.application_user WHERE uid='+sqlc.escape(uid),function(err,rows){
			callback(err,sqlc,uid);
		});
	},
	function(sqlc,uid,callback){
		sqlc.query('DELETE FROM xjos.user_priv_table WHERE uid='+sqlc.escape(uid),function(err,rows){
			callback(err,sqlc,uid);
		});
	},
	function(sqlc,uid,callback){
		var cuteobj={'aid':1,'uid':uid,'status':1};
		sqlc.query('INSERT INTO xjos.application_user SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'aid':2,'uid':uid,'status':1};
		sqlc.query('INSERT INTO xjos.application_user SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'aid':4,'uid':uid,'status':1};
		sqlc.query('INSERT INTO xjos.application_user SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'aid':5,'uid':uid,'status':1};
		sqlc.query('INSERT INTO xjos.application_user SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'pvid':4,'uid':uid,'time':new Date(),'childlen':0,'childnum':0,'childavail':0,'privfather':0};
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'pvid':8,'uid':uid,'time':new Date(),'childlen':0,'childnum':0,'childavail':0,'privfather':0};
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'pvid':9,'uid':uid,'time':new Date(),'childlen':0,'childnum':0,'childavail':0,'privfather':0};
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'pvid':10,'uid':uid,'time':new Date(),'childlen':0,'childnum':0,'childavail':0,'privfather':0};
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err,sqlc,uid);
		})
	},
	function(sqlc,uid,callback){
		var cuteobj={'pvid':12,'uid':uid,'time':new Date(),'childlen':0,'childnum':0,'childavail':0,'privfather':0};
		sqlc.query('INSERT INTO xjos.user_priv_table SET '+sqlc.escape(cuteobj),
		function(err,rows){
			callback(err);
			sqlc.end();
		})
	},
	function(cb){
		callback('ok');
		cb();
	}],
	function(err){
		if(err){
			console.log(err);
			if(err!='Already changed password')
				callback('err');
		}
	});
}
