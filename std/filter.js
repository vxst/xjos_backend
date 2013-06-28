var crypto=require('crypto');

function htmlfilter(html,whitelist){
	var lt=crypto.pseudoRandomBytes(4).toString('hex');
	var rt=crypto.pseudoRandomBytes(4).toString('hex');
	var p=[];

	if(whitelist==null){
		whitelist=['<p>','</p>','<b>','</b>','<h1>','</h1>','<div>','</div>','<br/>','<i>','</i>','<ol>','</ol>','<li>','</li>','<ul>','</ul>','<dt>','</dt>','<dd>','</dd>','<pre>','</pre>'];
	}

	html.replace('<',lt);
	html.replace('>',rt);

	for(var i=0;i<whitelist.length;i++){
		var str=whitelist[i];
		str.replace('<',lt);
		str.replace('>',rt);
		p.push({'object':whitelist[i],'original':str});
	}
	for(var i=0;i<p.length;i++){
		html.replace(p.original,p.object);
	}

	html.replace(lt,'&lt;');
	html.replace(rt,'&gt;');
	
	return html;
}

exports.htmlfilter=htmlfilter;
