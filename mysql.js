var mysql=require('mysql');
exports.pool  = mysql.createPool({
host:'210.33.7.109',
user:'talker',
password:'Bc4wKVTnMvXudxVs',
charset:'utf8_bin',
connectionLimit:32
});
//CL is 5, Debug option for prevent memory leak
//Should set to 10000 in produce
