var sql=require('./mysql').pool;
var async=require('async');
sql.getConnection(function(err,sqlconn){
	sqlconn.query("SELECT pid,old_info FROM xjos.problem",function(err,rows){
		console.log('SELECT FINISHED');
		var i=0;
		async.whilst(
		function(){return i<rows.length},
		function(callback){
			sql.getConnection(function(err,sqlconn2){
				var k=rows[i]['old_info'].split('#@#');
				var access=0,vlevel=0;
				for(var j in k){
					if(k[j].substr(0,6)=='access'){
						access=parseInt(k[j].split(':')[1]);
					}else if(k[j].substr(0,6)=='vlevel'){
						vlevel=parseInt(k[j].split(':')[1]);
					}
				}
				console.log(access+":"+vlevel);
				var sui=access*6+vlevel+Math.floor(Math.random()*10)-5;
				if(sui>60)sui=60;
				if(sui<0)sui=0;
				sqlconn2.query('UPDATE xjos.problem SET levelt='
				+sqlconn2.escape(sui)
				+' WHERE pid='
				+sqlconn2.escape(rows[i].pid)
				,function(err,rows){sqlconn2.end();callback();});
				if(i%10==0){
					console.log("First "+i+" finished");
				}
				i++;
			});
		},
		function(err){
		});
		sqlconn.end();
	});
});
