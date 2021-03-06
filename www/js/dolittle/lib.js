(function (){
var root={window:window,document:document, console:console};
window.root=root;
root.root=root;
var localize=function (obj, map) {
    for (var k in map) if (obj[k]) obj[map[k]]=obj[k];
};
root.create=function () {
    var r=Object.create(this);
    var init=(r.initialize || r["初期化"] || function (){});
    init.apply(r,arguments);
    return r;
};

root.addAlias=function () {
    var a=Array.prototype.slice.call(arguments);
    var orig=a.shift();
    var t=this;
    a.forEach(function (al) {
        //if (t in al) return;
        Object.defineProperty(t,al,{
	        enumerable:false,configurable:true,
	        get:function() { return this[orig]; },
	        set:function(v) { return this[orig]=v; }
        });
    });
    return this;
};
root.addAliasFromTable=function () {
    // objects, methods....
    var a=Array.prototype.slice.call(arguments).map(function (e) {
        return e.replace(/\s/g,"");
    });
    var objects=a.shift().split(",");
    var methods=a.join(",").split(",");
    objects.forEach(function (obj) {
        if (!root[obj]) {
            console.log("Warning! object ",obj," not found");
            return;
        }
        var originalMethod,cnt=0;
        for (var i=0 ;i<methods.length; i++) {
            //console.log("METHIN",methods[i],"in",root[obj],"->",methods[i] in root[obj]);
            if (methods[i] in root[obj]) {
                originalMethod=methods.splice(i,1);
                methods.unshift(originalMethod[0]);
                cnt++;
            }
        }
        if (cnt==1) {
            root.addAlias.apply(root[obj], methods);
        } else {
            console.log("Warning! addalias2 count=",cnt,"obj=",obj,"meth=",methods);
        }
    });
};
 var and={true:function(){var arr=Array.prototype.slice.call(arguments);var res=Boolean(arr[0]);$.each(arr,function(key,value){res=(res&&value);});return res;}};
 var or={true:function(){var arr=Array.prototype.slice.call(arguments);var res=Boolean(arr[0]);$.each(arr,function(key,value){res=(res||value);});return res;}};
 root.and=and;
 root.or=or;

root.system={
	localize: localize,
	new:function(obj){
		return new(Function.prototype.bind.apply(obj,arguments));
	},
	sleep:function(time){
		var start=new Date().getTime();
		var end=start+time;
		for(;;){
			if((new Date().getTime())>=end)break;
		}
	},
	throw:function(e){throw new Error(e);},
	"try": function (t,c,f) {
	    try {
	        return t.execute();
	    } catch(e) {
	        if (c) return c.execute(e);
	    } finally {
	        if (f) return t.execute();
	    }
	},
	write:function(o,k,v){
		o[k]=v;
		return o;
	},
	read:function(o,k){
		return o[k]
	},
	delete:function(o,k){
		delete o[k];
		return o;
	},
};

root.random=function(param){
	var res=Math.random();
	res=res*param;
	res=res-res%1;
	return res+1;
};
root.sin=function(param){return Math.sin(param);};
root.cos=function(param){return Math.cos(param);};
root.tan=function(param){return Math.tan(param);};
root.abs=function(param){return Math.abs(param);};

root.background={
	paint:function(color){$(document.body).css("background",color);}

};

root.true=true;
root.false=false;
root.undefined=undefined;
root.null=null;
root.instanceof=function(f,s){
    // @hoge1e3 f は何が来ても大丈夫。  null instanceof Array も通る
	//if(typeof f!="object")throw new Error("instanceofの第一引数にはオブジェクトを渡して下さい。");
	if(typeof s!="function")throw new Error("instanceofの第二引数には関数を渡して下さい。");
	return (f instanceof s);
};
root.typeof=function(p){return typeof p;};
root.is=function(){
    var child, parent;
    if (arguments.length>=2) {
        child=arguments[0];
        parent=arguments[1];
    } else {
        child=this;
        parent=arguments[0];
    }
    if((typeof parent)=="function") {
        parent=parent.prototype;
    }
	if((typeof parent)!="object")throw new Error("isの引数にはオブジェクトを渡して下さい。");
	return parent.isPrototypeOf(child);
};

//Array
Object.defineProperty(Array,"create",{
	enumerable:false,configurable:true,
	value:function(){
		return Array.prototype.slice.call(arguments);
	}
});
Object.defineProperty(Array.prototype,"get",{
	enumerable:false,configurable:true,
	value:function(index){return (this[index-1])?(this[index-1]):(null);}
});
Object.defineProperty(Array.prototype,"set",{
	enumerable:false,configurable:true,
	value:function(index,value){this[index-1]=value;return this;}
});
Object.defineProperty(Array.prototype,"add",{
	enumerable:false,configurable:true,
	value:function(value){this.push(value);return this;}
});
Object.defineProperty(Array.prototype,"remove",{
	enumerable:false,configurable:true,
	value:function(obj){
		for(var i=0;i<this.length;i++){
			if(this[i]===obj){this.removepos(i+1);break;}
		}
		return this;
	}
});
Object.defineProperty(Array.prototype,"removepos",{
	enumerable:false,configurable:true,
	value:function(index){this.splice(index-1,1);return this;}
});
Object.defineProperty(Array.prototype,"insert",{
	enumerable:false,configurable:true,
	value:function(index,value){this.splice(index-1,0,value);return this;}
});
Object.defineProperty(Array.prototype,"each",{
	enumerable:false,configurable:true,
	value:function(func){
		var res=undefined;
		for(var i=0;i<this.length;i++){
			res=func.execute(this[i]);
		}
		return res;
	},
});
Object.defineProperty(Array.prototype,"length?",{
	enumerable:false,configurable:true,
	value:function(){return this.length;}
});
Object.defineProperty(Array.prototype,"clear",{
	enumerable:false,configurable:true,
	value:function(){var length=this.length;for(var i=0;i<=length;i++)this.removepos(1);return this;}
});
Object.defineProperty(Array.prototype,"randomSelect",{
	enumerable:false,configurable:true,
	value:function(){
		return this[this.length.random()-1];
	}
});
Object.defineProperty(Array.prototype,"select",{
	enumerable:false,configurable:true,
	value:function(f){
		var res=[];
		for(var i=0;i<this.length;i++){
			if(f.execute(this[i])==true){
				res.push(this[i]);
			}
		}
		return res;
	}
});
Object.defineProperty(Array.prototype,"process",{
	enumerable:false,configurable:true,
	value:function(f){
		for(var i=0;i<this.length;i++){
			this[i]=f.execute(this[i]);
		}
		return this;
	}
});
Object.defineProperty(Array.prototype,"bond",{
	enumerable:false,configurable:true,
	value:function(j){
		return this.join((j)?j:"");
	}
});
Object.defineProperty(Array.prototype,"max",{
	enumerable:false,configurable:true,
	value:function(){
		var max=this[0];
		for(var i=0;i<this.length;i++){
			if(max<this[i]){
				max=this[i];
			}
		}
		return max;
	}
});
Object.defineProperty(Array.prototype,"min",{
	enumerable:false,configurable:true,
	value:function(){
		var min=this[0];
		for(var i=0;i<this.length;i++){
			if(min>this[i]){
				min=this[i];
			}
		}
		return min;
	}
});
//root["配列"]=Array;
root.Array=Array;

//Stringオブジェクト
String.prototype.add=String.prototype.concat;
String.prototype["contain?"]=function(_param){return -1!=this.valueOf().search(RegExp(_param));};
String.prototype["position?"]=function(p){return this.valueOf().search(RegExp(p))+1};
String.prototype.substr=function(){return ((arguments.length==1)?substr1:substr2).apply(this,arguments);};
String.prototype["length?"]=function(){return this.length;};
String.prototype.partition=function(s){return this.split(RegExp(s));};
String.prototype.oneReplace=function(_pattern,_replacement){return this.valueOf().replace((new RegExp(_pattern)),_replacement);};
String.prototype.allReplace=function(_pattern,_replacement){return this.valueOf().replace((new RegExp(_pattern,"g")),_replacement);};
var substr1=function(param){return this.substring(param-1);};
var substr2=function(param1,param2){return this.substring(param1-1,param2);}

//Booleanオブジェクト
Boolean.prototype.then=function(){return (this==true)?root._true:root._false;};
Boolean.prototype.else=function(){return (this==true)?root._false:root._true;};
Boolean.prototype.not=function(){return (false==this);};
//Number
["abs","floor","sqrt","round","ceil","exp"].forEach(function (k) {
    Number.prototype[k]=function () {
        return Math[k](this);
    };
});
["sin","cos","tan"].forEach(function (k) {
    Number.prototype[k]=function () {
        return Math[k](this.radian());
    };
});
["atan","acos","asin"].forEach(function(k){
	Number.prototype[k]=function(){
		return Math[k](this).degree();
	};
});
Number.prototype.atan2=function(y){
	return Math.atan2(y,this).degree();
};
Number.prototype.pow=function(m){
	return Math.pow(this,m);
};
Number.prototype.log=function(){
	return Math.log10(this);
};
Number.prototype.ln=function(){
	return Math.log(this);
};
Number.prototype.radian=function() {
    return this/180*Math.PI;
};
Number.prototype.degree=function() {
    return this/Math.PI*180;
};
Number.prototype.random=function(){
	return Random.random(this);
};
Number.prototype.setSeed=function(){
	return Random.setSeed(parseInt(this));
};
Number.prototype.add=function(n){
	return this+n;
};
Number.prototype.sub=function(n){
	return this-n;
};
Number.prototype.mul=function(n){
	return this*n;
};
Number.prototype.div=function(n){
	return this/n;
};
Number.prototype.mod=function(n){
	return this%n
};
Number.prototype.eq=function(n){
	return this==n
};
Number.prototype.ne=function(n){
	return this!=n
};
Number.prototype.gt=function(n){
	return this>n
};
Number.prototype.ge=function(n){
	return this>=n
};
Number.prototype.lt=function(n){
	return this<n
};
Number.prototype.le=function(n){
	return this<=n
};
Number.prototype.fromCharCode=function(){
	return String.fromCharCode(this);
};

var Random=new function(){
	this.mtjs=new MersenneTwister();
	
};

Random.setSeed=function(s){
	this.mtjs.setSeed(s);
	return s;
};
Random.random=function(m){
	return (m>0)?(this.mtjs.nextInt(1,m+1)):(this.mtjs.next());
};

//Function
Function.prototype.execute	=	function(){return this.apply(this.bound||this,arguments);};
Function.prototype.repeat=function(param){
	var res;
	for(var i=1;i<=param;++i)res=this.execute(i);
	return res;
};
Function.prototype.while=function(){
	return root._while.create(this);
};
Function.prototype.then=function(){return (this.execute(this,arguments))?root._true:root._false;};
Function.prototype.else=function(){return (this.execute(this,arguments))?root._false:root._true;};
Function.prototype.checkerror=function () {
    var f=this;
    return dtlbind(f.bound, function () {
        try {
           return f.apply(this,arguments);
        } catch(e) {
            if (onerror) onerror(e.message,"unknown",1,1,e); 
            else throw e; 
        }
    });
};
Function.prototype.or=function(){
	var res;
	var args=(arguments.length)?Array.prototype.slice.call(arguments):[];
	args.unshift(this);
	var obj=function(){
		this.func=(function(){});
		this.params=[];
	};
	var objs=[];
	do{
		objs.push(new obj());
		objs[objs.length-1].func=args.shift();
		while(!(typeof args[0]).match(/function|undefined/)){
			objs[objs.length-1].params.push(args.shift());
		}
	}while(args.length>0);
	var keys=Object.keys(objs);
	for(var i=0;i<keys.length;i++){
		i=keys[i];
		res=objs[i].func.execute.apply(objs[i].func,objs[i].params);
		if(res)break;
	}
	return ((res)?res:root.false);
}
Function.prototype.try=function(){
	var res={
		catch:function(){
			return {finally:res.finally};
		},
		finally:function(f){
			f.execute();
		}
	};
	try{
		this.execute.apply(this,arguments);
	}catch(e){
		res.catch=function(f){f.execute(e);return {finally:res.finally};};
	}
	return res;
};
var _jsroot; (function () {_jsroot=this;})();
function dtlbind(bound, f) {
    f.bound=bound;
    return f;
};
window.dtlbind=dtlbind;
root._while=root.create();
root._while.initialize=function(f){
	this.s=f;
};
root._while.execute=function(f){
	var res=undefined;
	while(this.s()){
		res=f.execute();
	}
	return res;
};

root._true=root.create();
root._true.else= function (func) {
	return (root._done.create(func.execute()));
};
root._true.execute= function (func) {
	return func.execute();
};
root._true.then= function(func){
	return (func).then();
};
root._false=root.create();
root._false.else= function(func){
	return root._true;
};
root._false.execute= function(func){
	return undefined;
};
root._false.then= function(func){
	return (func).then();
};


root._done= root.create();
root._done.initialize=function(p){
	this._self=p;
};
root._done.else= function(func){
	return this;
};
root._done.execute=function(func){
	return this._self;
};
root._done.then=function(func){
	return this;
};

root.module={
    require: function () {
        var a=Array.prototype.slice.call(arguments);
        var reqs=[],func;
        while (true) {
            var v=a.shift();
            if (v==null) break;
            if (typeof v=="string") reqs.push(v);
            if (typeof v=="function") {
                func=v;
                break;
            }
        }
        return window.requirejs(reqs,function() {
            if (func) return func.checkerror().execute(arguments);
        });
    }
};

})();
