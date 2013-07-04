var fs=require('fs');
//    process=require('process');
   /*
   	S: System Fail: Stop All System Right Away
	BSync: Very important System Information
   	A: System Error
	B: Attack Attempt
	C: Important Information(Like login/out, Connection start/end)
	D: Normal Information
   */
function logerror(rate,info){
	if(rate==='S'){
		console.log('SYSTEM FAIL:'+(new Date())+info);
		console.log('SYSTEM WILL STOP NOW.');
		fs.writeFileSync('/home/sttc/nodelog','SYSFAIL:'+JSON.stringify(new Date())+':'+info+'##\n',{'flag':'a'});
		fs.writeFileSync('/home/sttc/nodeimportant','SYSFAIL:'+JSON.stringify(new Date())+':'+info+'##\n',{'flag':'a'});
		process.exit(1);
	}else
	if(rate==='A'){
		console.log('ERROR:'+info);
		fs.writeFile('/home/sttc/nodelog','ERROR:'+JSON.stringify(new Date())+':'+info+'#\n',{'flag':'a'},function(err){
			if(err){
				console.log('Log File Error:'+err);
				console.log('LOG FILE ERR, SITUATION CRITICAL. SYSTEM WILL STOP NOW.');
				process.exit(1);
			}
		});
		fs.writeFile('/home/sttc/nodeimportant','ALERT:'+JSON.stringify(new Date())+':'+info+'#\n',{'flag':'a'},function(err){
			if(err){
				console.log('Log File Error:'+err);
				console.log('LOG FILE ERR, SITUATION CRITICAL. SYSTEM WILL STOP NOW.');
				process.exit(1);
			}
		});
	}else if(rate==='B'){
		console.log('ALERT:'+info);
		fs.writeFile('/home/sttc/nodelog','ALERT:'+JSON.stringify(new Date())+':'+info+'#\n',{'flag':'a'},function(err){
			if(err){
				console.log('Log File Error:'+err);
				console.log('LOG FILE ERR, SITUATION CRITICAL. SYSTEM WILL STOP NOW.');
				process.exit(1);
			}
		});
		fs.writeFile('/home/sttc/nodeimportant','ALERT:'+JSON.stringify(new Date())+':'+info+'#\n',{'flag':'a'},function(err){
			if(err){
				console.log('Log File Error:'+err);
				console.log('LOG FILE ERR, SITUATION CRITICAL. SYSTEM WILL STOP NOW.');
				process.exit(1);
			}
		});
	}else if(rate==='C'){
		fs.writeFile('/home/sttc/nodelog','importantInfo:'+JSON.stringify(new Date())+':'+info+'#\n',{'flag':'a'},function(err){
			if(err){
				console.log('Log File Error:'+err);
				console.log('LOG FILE ERR, SITUATION CRITICAL. SYSTEM WILL STOP NOW.');
				process.exit(1);
			}
		});
	}else if(rate==='D'){
		fs.writeFile('/home/sttc/nodelog','Info:'+JSON.stringify(new Date())+':'+info+'#\n',{'flag':'a'},function(err){
			if(err){
				console.log('Log File Error:'+err);
				console.log('LOG FILE ERR, SITUATION CRITICAL. ');
			}
		});
	}else if(rate==='BSync'){
		fs.writeFileSync('/home/sttc/nodelog','SYSINFO:'+JSON.stringify(new Date())+':'+info+'##\n',{'flag':'a'});
		fs.writeFileSync('/home/sttc/nodeimportant','SYSINFO:'+JSON.stringify(new Date())+':'+info+'##\n',{'flag':'a'});
	}else{
		logerror('A','Log Information Format Wrong:rate:'+rate+',info:'+info);
	}
}
exports.srvlog=logerror;
