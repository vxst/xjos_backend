var crypto = require('crypto');
var fs = require('fs');
/*var filename;

for(var i=2;i<process.argv.length;i++){
	filename = process.argv[i];
	gethash(filename,9,function(fn){
		return function(val){
			console.log(val+' '+fn);
		};
	}(filename));
}*/

exports.gethash=function gethash(fn,len,cb){
	var shasum = crypto.createHash('sha512')

	var s = fs.ReadStream(filename);

	s.on('data', function(d) {
		shasum.update(d);
	});

	s.on('end', function() {
		cb(shasum.digest().slice(0,len).toString('base64'));
	});
}
