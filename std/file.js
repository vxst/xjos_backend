var gethash=require('../tools/hash').gethash;
var crypto = require('crypto');
var async=require('async');
var fs=require('fs');

exports.bin=function(uid,ord,dtx,dtb,sql,cb){
	if(uid===undefined){
		cb('NOT ABLR');
		return;
	}
	if(ord==='upload'){
		upload(uid,dtx,dtb,sql,cb);
	}else if(ord==='dupload'){
		dupload(uid,dtx,dtb,sql,cb);
	}
}
function makeuuid(callback){
	crypto.pseudoRandomBytes(12,function(err,buf){
		if(err){
			console.log(err);
			callback(null);
		}else{
			callback(buf.toString('hex'));
		}
	});
}
function makeuniquedir(callback){
	var dir='';
	async.waterfall([
	function(callback){
		makeuuid(function(uuid){
			if(uuid==null){
				callback('Not able to make pseudo random bits');
				return;
			}
			callback(null,uuid);
		});
	},
	function(uuid,callback){
		dir='/tmp/'+uuid+'/';
		fs.mkdir(dir,callback);
	}],
	function(err){
		if(err){
			console.log('MakeUniqueDir Fail:'+err);
		}else{
			callback(dir);
		}
	});
}
function getext(fn){
	for(var i=fn.length-1;i>=0;i--){
		if(fn[i]=='.'){
			return fn.substr(i+1);
		}
	}
	return null;
}

function dupload(uid,dtx,dtb,sql,cb){
	var k;
	console.log('Start DUpload');
	try{
		k=JSON.parse(dtx);
		if(typeof(k.filename)!='string'||k.filesize!=dtb.length||isNaN(k.pid)){
			cb('DUpload:ERR:JSON_FORMAT_ERROR');
			console.log('JSON_FORMAT_ERROR');
			console.log(JSON.stringify(k));
			console.log(JSON.stringify(dtb.length));
			return;
		}
		if(getext(k.filename)==null){
			console.log('Need Ext');
			return;
		}
	}catch(e){
		console.log('DUP:'+e);
	}
	if(uid==undefined){
		cb('FAILED');
		console.log('Nouid');
		return;
	}
	console.log('Hehe');
	makeuniquedir(function(dir){
		if(dir!=null)
			fs.writeFile(dir+k.filename,dtb);
		console.log('DD:'+dir);
	});
}
function upload(uid,datatxt,databin,sql,callback){
	var obj=new Object();
	var k;
	try{
		k=JSON.parse(datatxt);
		if(k.length!=databin.length){
			callback('DATA TRANSFORM ERROR "LNE"');
		}
		if(typeof(k.filename)!='string'){
			callback('JSON ERROR: "DTNF"');
		}
	}catch(e){
		callback('JSON STRUCT ERROR');
		return;
	}

	async.waterfall([
	function(callback){
		var shasum = crypto.createHash('sha512');
		shasum.write(databin,null,function(){callback(shasum)});
	},
	function(shasum,callback){
		callback(shasum.digest().slice(0,9).toString('base64'));
	},
	function(hash,callback){
		sql.getConnection(
			function(sqlconn){
				callback(null,hash,sqlconn);
			}
		)
	},
	function(hash,sqlconn,callback){
		sqlconn.query("SELECT * FROM sxjfs.data_db WHERE hash="+sqlconn.escape(hash),function(err,rows){
			if(rows.length>0){
				callback(null,hash,sqlconn,true);
			}else{
				callback(null,hash,sqlconn,false);
			}
		});
	},
	function(hash,sqlconn,isinputed,callback){
		if(isinputed){
			callback(null,hash,sqlconn);
		}else{
			var inputobj=new Object();
			inputobj.hash=hash;
			inputobj.data=databin;
			sqlconn.query("INSERT INTO sxjfs.data_db SET ?",inputobj,function(err,res){
				callback(err,hash,sqlconn);
			});
		}
	},
	function(hash,sqlconn,callback){
		sqlconn.query("DELETE FROM sxjfs.name_db WHERE uid=? AND dir=?",[uid,k.filename],function(err,res){
			callback(null,hash,sqlconn);
		});
	},
	function(hash,sqlconn,callback){
		databin=undefined;
		var inputobj=new Object();
		inputobj.uid=uid;
		inputobj.dir=k.filename;
		inputobj.size=k.length;
		inputobj.data=hash;
		sqlconn.query("INSERT INTO sxjfs.name_db SET ?",inputobj,function(err,res){
			callback(err);
			sqlconn.end();
		})
	}],
	function(err){
		if(err!=null){
			callback(err);
		}else{
			callback('ok');
		}
	});
}
exports.main=function(conn,handle,data,sql,cb){
	if(handle=='remove'){
		remove(conn.uid,data,sql,cb);
	}
}
function remove(uid,place,sql,cb){
	sql.getConnection(function(sqlconn){
		sqlconn.query("DELETE FROM sxjfs.name_db WHERE uid=? AND dir=?",[uid,place],function(err,res){
			if(err==null)
				cb('ok');
			else
				cb('failed');
			sqlconn.end();
		});
	});
}
