var crypto=require('crypto'),
    srvlog=require('../lib/log').srvlog;

function htmlfilter(html,whitelist){
	var lt=crypto.pseudoRandomBytes(4).toString('hex');
	var rt=crypto.pseudoRandomBytes(4).toString('hex');
	var p=[];

	if(whitelist==null){
		whitelist=['<p>','</p>','<b>','</b>','<h1>','</h1>','<div>','</div>','<br/>','<i>','</i>','<ol>','</ol>','<li>','</li>','<ul>','</ul>','<dt>','</dt>','<dd>','</dd>','<pre>','</pre>'];
	}

	html=html.replace(/\</gi,lt);
	html=html.replace(/\>/gi,rt);

	console.log(html);

	for(var i=0;i<whitelist.length;i++){
		var str=whitelist[i];
		str=str.replace('<',lt);
		str=str.replace('>',rt);
		p.push({'object':whitelist[i],'original':str});
	}

	console.log(html);

	for(var i=0;i<p.length;i++){
		var ctcount=0;
		var oldhtml;
		do{
			oldhtml=html;
			html=html.replace(p.original,p.object);
			ctcount++;
		}while(html!=oldhtml&&ctcount<10000);
		if(ctcount>5000){
			srvlog('B','HTML TOO MUCH REPLACE');
		}
	}

	console.log(p);

	console.log(html);
	
	var ctcount=0,oldhtml;
	do{
		oldhtml=html;
		html=html.replace(lt,'&lt;');
		html=html.replace(rt,'&gt;');
		ctcount++;
	}while(html!=oldhtml&&ctcount<10000);
	if(ctcount>5000){
		srvlog('B','HTML TOO MUCH REPLACE');
	}

	console.log(html);
	
	return html;
}

exports.htmlfilter=htmlfilter;
