var async=require('async');
var crypto=require('crypto');
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
function verifykey(password,ssalt,cb){
	var salt=new Buffer(ssalt,'base64');
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
exports.genkey=genkey;
exports.verifykey=verifykey;
