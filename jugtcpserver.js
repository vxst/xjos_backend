exports.start=function(eventbus){
	require('net').createServer(function(c){
//		console.log('server connected');
		c.on('end', function() {
//			console.log('server disconnected');
		});
		c.on('data',function(s){
			s=s.toString();
			console.log("REC:"+s);
			if(s[0]=='P'){
				s=s.slice(1);
				var isok=false,count=0;
				for(var i=0;i<s.length;i++){
					if(s[i]==':'){
						count++;
					}
				}
				if(count==5)isok=true;
				if(!isok)
					return;
				eventbus.emit('tcp.judge.'+s.split(':',1)[0],s.split(':',6));
			}else if(s[0]=='A'){
				s=s.slice(1);
				var isok=false,count=0;
				for(var i=0;i<s.length;i++){
					if(s[i]==':'){
						count++;
					}
				}
				if(count==5)isok=true;
				if(!isok)
					return;
				eventbus.emit('tcp.judgefinish.'+s.split(':',1)[0],s.split(':',6));
			}
		});
	}).listen(8127, function() {
		console.log('TCP Server started at 8127');
	});
}
