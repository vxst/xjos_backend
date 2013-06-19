var https = require("https");
var fs = require('fs');
var url = require("url");

exports.start=function(route,handle,mysql){
	var options={	key: fs.readFileSync('keys/xjosdyn.key'),
			cert: fs.readFileSync('keys/xjosdyn.crt'),
			ciphers:'RC4',
			passphrase:'t7j8bf9'};

	var server=https.createServer(options,
	function(request, response) {
		console.log('HTTPS REQ');
		response.writeHead(200, {'Content-Type': 'text/plain','Server':'ST Dynamic Server'});
		route(url.parse(request.url).pathname,url.parse(request.url).query,response,handle,mysql,request,
		function(err){
			response.end();
		});
	});
//	server.setTimeout(365*24*3600*1000,function(){});
	server.timeout=0;
	server.listen(12701);
	console.log('Main Node Server started. Listen on 12701');
	return server;
}
