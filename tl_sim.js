var mysql=require('./mysql').pool;
var async=require('async');
var elopvp=require('./std/libelo').personvsproblem;
var k={};

function getpid(probstr){
	return parseInt(probstr.slice(3,7));
}

function resetarr(){
	mysql.getConnection(function(err,sql){
		sql.query('SELECT pid,old_info FROM xjos.problem',
		function(err,res){
			for(t in res){
				k[getpid(res[t]['old_info'])]=res[t]['pid'];
			}
			sql.end();
		});
	});
}

function testelo(){
	var ct={};
	mysql.getConnection(function(err,sql){
		if(err)
			console.log(err);
		sql.query('SELECT proid,uid,status FROM tester.submit',
		function(err,res){
			if(err)
				console.log(err);
			async.eachSeries(res,
			function(t,callback){
				async.waterfall([
				function(callback){
					if(ct[t.uid]==undefined){
						ct[t.uid]={};
						ct[t.uid][t.probid]=0;
						sql.query("INSERT INTO `tester`.`user_test`(`uid`, `elo`) VALUES ("+sql.escape(t.uid)+",1500)",
						function(err,rows){
							callback(err);
						});
					}else{
						ct[t.uid][t.probid]+=1;
						callback(null);
					}
				},
				function(callback){
					sql.query("SELECT elo FROM `tester`.`user_test` WHERE uid="+sql.escape(t.uid),
					function(err,rows){
						callback(err,rows[0]['elo']);
					});
				},
				function(userelo,callback){
					sql.query("SELECT elo FROM `xjos`.`problem` WHERE pid="+sql.escape(k[t.probid]),
					function(err,rows){
						callback(err,userelo,rows[0]['elo']);
					});
				},
				function(userelo,probelo,callback){
					var res;
					if(t['status']=='Accept'){
						res=1;
					}else{
						res=0;
					}
					callback(null,elopvp(userelo,probelo,res,ct[t.uid][t.probid]+1));
				},
				function(ret,callback){
					sql.query('UPDATE tester.user_test SET elo='+sql.escape(ret.person)+" WHERE uid="+sql.escape(t.uid),function(err,rows){
						callback(err,ret);
					});
				},
				function(ret,callback){
					sql.query('UPDATE xjos.problem SET elo='+sql.escape(ret.person)+' WHERE pid='+sql.escape(k[t.probid]),function(err,rows){
						callback(err,ret);
					});
				}],
				function(err){
					if(err){
						console.log(err);
					}
				});
				callback(null);
			},
			function(err){
				if(err){
					console.log(err);
				}
			});
		});
	});
}

resetarr();
testelo();
