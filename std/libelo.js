var plainelo=function(powa,powb,r,k){
	var ap = 1/(1+Math.pow(10,(powb-powa)/400.0));
	var bp = 1/(1+Math.pow(10,(powa-powb)/400.0));
	var ag = r,bg = 1-r;
	return {'powa':powa+k*(ag-ap),'powb':powb+k(bg-bp)};
}

//Normally, OJ has much more events than master-level chess competition. So set Kmax=32 is suitable.
var personvsproblem=function(person,problem,r,t){
	//ASSERT t>=1
	var k,newperson,newproblem;
	var ap = 1/(1+Math.pow(10,(problem-person)/400.0));
	var bp = 1/(1+Math.pow(10,(person-problem)/400.0));
	var ag=r,bg=1-r;
	if(r===1){
		//Dec But Not Too Much
		k=64/(0.5+t*1.5);
	}else if(r===0){
		k=128/((t+2)*(t+2)); 
		//When t>10, the k is so little that the influence is ~0
	}
	newproblem=problem+k*(bg-bp);
	newperson=person+k*(ag-ap);

	if(newperson<person)newperson=person;

	return {'problem':newproblem,'person':newperson};
}

exports.personvsproblem=personvsproblem;
