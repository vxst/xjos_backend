exports.mainfun=function(path,query,response){
	response.writeHead(404,'Meanless order', {'Content-Type':'text/plain','Server':'ST Dynamic Server'});
	response.write('This is A Dynamic Server, users shouldn\'t visit this server directly. Order '+path+' is meanless on this server.');
}

