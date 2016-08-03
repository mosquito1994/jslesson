root.Accelo=root.create();
root.Accelo.x=0;
root.Accelo.y=0;
root.Accelo.動作=(function(){});
root.Accelo.initialize=function(){
	if (
		(window.navigator.userAgent.indexOf('iPhone') > 0 || 
		window.navigator.userAgent.indexOf('iPad') > 0 || 
		window.navigator.userAgent.indexOf('iPod') > 0 || 
		window.navigator.userAgent.indexOf('Android') > 0)==false){
		window.alert("タブレット、スマホ専用のオブジェクトです。この端末では動作しないことがあります");
		//return -1;
	}
	var self=this;
	window.$(function(){
		window.addEventListener("devicemotion", function(evt){
			var x=((evt.accelerationIncludingGravity.x));
			var y=((evt.accelerationIncludingGravity.y));

			if(window.orientation==0){
				self.x=y,self.y=x;
			}else if(window.orientation==180){
				self.x=-y,self.y=-x;
			}else if(window.orientation==90){
				self.x=x,self.y=-y;
			}else {
				self.x=-x,self.y=y;
			}
			self["動作"].execute(self.x,self.y);
		},true);
	});
};
root.Accelo["動作"]=(function(){});
root.Accelo["横の傾き"]=function(){return this.y};
root.Accelo["xの傾き"]=root.Accelo["横の傾き"];
root.Accelo["xの傾き"]=root.Accelo["横の傾き"];
root.Accelo["縦の傾き"]=function(){return this.x};
root.Accelo["yの傾き"]=root.Accelo["縦の傾き"];
root.Accelo["yの傾き"]=root.Accelo["縦の傾き"];

root.加速度センサ =root.Accelo;
root.傾きセンサ=root.加速度センサ;


root.Compass=root.create();
root.Compass.direction=0;
root.Compass["動作"]=(function(){});
root.Compass.initialize=function(){
	if (
		(window.navigator.userAgent.indexOf('iPhone') > 0 || 
		window.navigator.userAgent.indexOf('iPad') > 0 || 
		window.navigator.userAgent.indexOf('iPod') > 0 || 
		window.navigator.userAgent.indexOf('Android') > 0)==false){
		window.alert("タブレット、スマホ専用のオブジェクトです。この端末では動作しないことがあります");
		//return -1;
	}
	var self=this;
	window.$(function(){
		window.ondeviceorientation=function(evt){
			self.direction=evt.webkitCompassHeading;
			self["動作"].execute(self.directioin);
		};
	});
};
root.Compass["方向?"]=function(){return this.direction;};
root.Compass["方角?"]=function(){
	var res;
	if(this.direction>315)res="北";
	else if(this.direction>225)res="西";
	else if(this.direction>135)res="南";
	else if(this.direction>45)res="東";
	else res="北";
	return res;
};
root["磁気センサ"]=root.Compass;
root["磁気センサー"]=root.Compass;
root["コンパス"]=root.Compass;
root["方位磁針"]=root.Compass;
root["方位磁石"]=root.Compass;

root.GPS=root.create();
root.GPS.latitude=0;
root.GPS.longitude=0;
root.GPS.gps=null;
root.GPS.initialize=function(){
	if (
		(window.navigator.userAgent.indexOf('iPhone') > 0 || 
		window.navigator.userAgent.indexOf('iPad') > 0 || 
		window.navigator.userAgent.indexOf('iPod') > 0 || 
		window.navigator.userAgent.indexOf('Android') > 0)==false){
		window.alert("タブレット、スマホ専用のオブジェクトです。この端末では動作しないことがあります");
		//return -1;
	}
	window.$(function(){
		this.gps=window.navigator.geolocation.getCurrentPosition(function(position){
			var latitude=position.coords.latitude;
			var longitude=position.coords.longitude;
			this.latitude=latitude;
			this.longitude=longitude;
			return position;
		}	,function(){window.alert("GPSの立ち上げに失敗しました。");return -1;});
	});
};
root.GPS["緯度?"]=function(){return this.latitude;};
root.GPS["経度?"]=function(){return this.longitude;};
root.GPS["今どこ?"]=function(){return this.latitude+"/n"+this.longitude;};

root.タッチセンサ=root.create();
root.タッチセンサ.x=0;
root.タッチセンサ.y=0;
root.タッチセンサ.touching=false;
root.タッチセンサ.touched=false;
root.タッチセンサ["動作"]=(function(){});
root.タッチセンサ.initialize=function(){
	if (
		(window.navigator.userAgent.indexOf('iPhone') > 0 || 
		window.navigator.userAgent.indexOf('iPad') > 0 || 
		window.navigator.userAgent.indexOf('iPod') > 0 || 
		window.navigator.userAgent.indexOf('Android') > 0)==false){
		window.alert("タブレット、スマホ専用のオブジェクトです。この端末では動作しないことがあります");
		//return -1;
	}
	var self=this;
	window.$(function(){
		window.document.addEventListener("touchstart", function(evt){
			var x=0,y=0;
			//var width=document.getElementById("canvas").width/2;
			//var height=document.getElementById("canvas").height/2;
			var width=window.$("#canvas").context.documentElement.clientWidth/2;
			var height=window.$("#canvas").context.documentElement.clientHeight/2;
			x=evt.touches[0].clientX;
			y=evt.touches[0].clientY;	
			self.x=x-width;
			self.y=height-y;
			self.touching=true;
			self.touched=true;
			if(evt.cancelable)e.preventDefault();
			self["動作"].execute(self.x,self.y);
	  }, true);
	});

	window.$(function(){
	  window.document.addEventListener("touchmove", function(evt){
			var x=0,y=0;
			//var width=document.getElementById("canvas").width/2;
			//var height=document.getElementById("canvas").height/2;
			var width=window.$("#canvas").context.documentElement.clientWidth/2;
			var height=window.$("#canvas").context.documentElement.clientHeight/2;
			x=evt.touches[0].clientX;
			y=evt.touches[0].clientY;
			self.x=x-width;
			self.y=height-y;
			if(evt.cancelable)e.preventDefault();
			self["動作"].execute(self.x,self.y);	
		}, true);
	});
	window.$(function(){
		window.document.addEventListener("touchend", function(evt){
			self.touching=false;
		}, true);
	});
	window.$(function(){
		window.document.addEventListener("touchcancel", function(evt){
			self.touching=false;
		}, true);
	});
};
root.タッチセンサ["タッチした?"]=function(){
	var res=this.touched;
	this.touched=false;
	return res;
};
root.タッチセンサ["触れた?"]=root.タッチセンサ["タッチした?"];
root.タッチセンサ["タッチしている?"]=function(){return this.touching;};
root.タッチセンサ["タッチしてる?"]=root.タッチセンサ["タッチしている?"];
root.タッチセンサ["触れている?"]=root.タッチセンサ["タッチしている?"];
root.タッチセンサ["触れてる?"]=root.タッチセンサ["タッチしている?"];
root.タッチセンサ["横の位置?"]=function(){return this.x;};
root.タッチセンサ["xの位置?"]=root.タッチセンサ["横の位置?"];
root.タッチセンサ["縦の位置?"]=function(){return this.y;};
root.タッチセンサ["yの位置?"]=root.タッチセンサ["縦の位置?"];
root.タッチセンサー=root.タッチセンサ;

root.ジャイロセンサ=root.create();
root.ジャイロセンサ.x=0;
root.ジャイロセンサ.y=0;
root.ジャイロセンサ.z=0;
root.ジャイロセンサ["動作"]=(function(){});
root.ジャイロセンサ.initialize=function(){
	if (
		(window.navigator.userAgent.indexOf('iPhone') > 0 || 
		window.navigator.userAgent.indexOf('iPad') > 0 || 
		window.navigator.userAgent.indexOf('iPod') > 0 || 
		window.navigator.userAgent.indexOf('Android') > 0)==false){
		window.alert("タブレット、スマホ専用のオブジェクトです。この端末では動作しないことがあります");
		//return -1;
	}
	var self=this;
	window.$(function(){
		window.addEventListener("deviceorientation",function(evt){
			var x=evt.gamma;
			var y=evt.beta;
			var z=evt.alpha;
			self.x=x;
			self.y=y;
			self.z=z;
			self["動作"].execute(self.x,self.y,self.z);
		},true);
	});
};
root.ジャイロセンサ["回した角度?"]=function(){return this.x;};
root.ジャイロセンサ["x軸の角度?"]=root.ジャイロセンサ["回した角度?"];
root.ジャイロセンサ["縦の角度?"]=function(){return this.y;};
root.ジャイロセンサ["y軸の角度?"]=root.ジャイロセンサ["縦の角度?"];
root.ジャイロセンサ["横の角度?"]=function(){return this.z;};
root.ジャイロセンサ["z軸の角度?"]=root.ジャイロセンサ["横の角度?"];
root.ジャイロセンサー=root.ジャイロセンサ;
