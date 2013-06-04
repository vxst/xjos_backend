var crypto=require('crypto');
crypto.pbkdf2("Hello","SUI",2500000,9,function(err,dk){console.log(dk.toString('hex'))});
