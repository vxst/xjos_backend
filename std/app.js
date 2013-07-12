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
		sqlc.query('SELECT application.app_icon_url AS appIconUrl,application.aid,application.app_name AS appName,appuk.status FROM xjos.application LEFT JOIN (SELECT xjos.application_user.status,xjos.application_user.aid FROM xjos.application_user WHERE uid='+sqlc.escape(uid)+') AS appuk ON appuk.aid=application.aid',
		function(err,rows){
			sqlc.end();
			callback(err,rows);
		});
	},
	function(rows,cb){
		callback(JSON.stringify(rows));
		cb();
	}],
	function(err){
		if(err)
			srvlog('B',err);
	});
}
