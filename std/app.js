//theFirstFileOfNewNameDefs!
/*New Name Defs:
  1.Function Short(len<=5):All Lowercase
  2.Function Long(len>5):camelCase
  3.Vars single char:Lowercase
  4.Vars not single char:Like Function
*/

var isok=require('../lib/isok').isok;
var async=require('async');
var filter=require('./filter').htmlfilter;
var srvlog=require('../lib/log').srvlog;

exports.main=function(conn,handle,data,sql,callback){
	isok(conn.uid,'common',sql,
	function(ct){
		if(ct==0){
			return;
		}else if(handle==='listApps'){
			listApps(conn.uid,data,sql,callback);
		}
	});
}
function listApps(uid,data,sql,callback){
	async.waterfall([
	function(callback){
		sql.getConnection(callback);
	},
	function(sqlc,callback){
		sqlc.query('SELECT aid,app_name,status FROM xjos.application LEFT JOIN xjos.application_user ON application_user.aid=application.aid WHERE uid='+sqlc.escape(uid),function(err,rows){
			sqlc.end();
			callback(err,rows);
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err
	}
}
