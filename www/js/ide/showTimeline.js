var curcv;
var pat=/([0-9]+)-([0-9]+)-([0-9]+)T([0-9]+):([0-9]+):([0-9]+)/;
var min=str2date("2016-04-01T00:00:00");
var max=str2date("2016-08-01T00:00:00");
var WIDTH=800,HEIGHT=30;
var queue=[];
var lineY;
var curUser;
var userInfo={};// "file"->{pos2str:[x->datestr]};
function getUserInfo(file) {
    file=file||curUser;
    if (userInfo[file]) return userInfo[file];
    return userInfo[file]={pos2str:[]};
}
setInterval(function () {
    var f=queue.shift();
    if (f) f();
},0);
Date.prototype.add=function (o) {
    if (typeof o=="number") {
        return new Date(this.getTime()+o);
    } 
};
Date.prototype.sub=function (o) {
    if (typeof o=="number") {
        return new Date(this.getTime()-o);
    } 
    return this.getTime()-o.getTime();
};
function pad(str,p) {
    str=p+str;
    return str.substring(str.length-p.length);
}
Date.prototype.format=function (fmt) {
    var d=this;
    return fmt.replace(/y/ig,function () {
        return pad(d.getYear()+1900,"0000");    
    }).replace(/M/g,function () {
        return pad(d.getMonth()+1,"00");    
    }).replace(/d/ig,function () {
        return pad(d.getDate(),"00");    
    }).replace(/h/ig,function () {
        return pad(d.getHours(),"00");    
    }).replace(/m/g,function () {
        return pad(d.getMinutes(),"00");    
    }).replace(/s/ig,function () {
        return pad(d.getSeconds(),"00");    
    });
};
function duration() {
    return max.sub(min);
}
function pos2date(x) {
    return min.add(x/WIDTH*duration());
}
function date2pos(d) {
    return d.sub(min)/max.sub(min)*WIDTH;
}
function setRange(i,a) {
    min=str2date(i);max=str2date(a);
    setScale($("#scale"));
}
function setScale(cv) {
    var ctx=cv[0].getContext("2d");
    for (i=0; i<10 ;i++) {
        var d=pos2date(WIDTH/10*i);
        ctx.fillText(d.format("M/D"),WIDTH*i/10,HEIGHT/3);
        ctx.fillText(d.format("h:m"),WIDTH*i/10,HEIGHT/3*2);
    }
    addZoomListener(cv);
}
function addZoomListener(cv) {
    cv.click(function (e) {
        var x=(e.clientX-cv.offset().left);
        // 0.5 -> 2
        // 0.25 -> 1
        // 0 -> 0.5
        var zoom=0.5+Math.abs(x/WIDTH-0.5)*3;
        var center=pos2date(x)
        var nmin=center.sub(duration()*zoom/2);
        var nmax=center.add(duration()*zoom/2);
        location.href="showTimeline.php?min="+date2str(nmin)+"&max="+date2str(nmax);
        //alert(date2str(nmin)+" - "+date2str(nmax));
    });
}
function date2str(d) {
    return d.format("Y-M-DTh:m:s");
}
function str2date(s) {
    var m=pat.exec(s);
    var res=new Date();
    if (m) {
        res.setFullYear(m[1]);
        res.setMonth(m[2]-1);
        res.setDate(m[3]);
        res.setHours(m[4]);
        res.setMinutes(m[5]);
        res.setSeconds(m[6]);
    }
    return res;
}
function showLine(time) {
//2016-05-08T20:51:17+09:00  
    time=time.replace(/\+.*/,"");
    var ctx=curcv[0].getContext("2d");
    var d=str2date(time);
    var x=Math.floor(date2pos(d));
    ctx.fillRect(x,lineY,1,HEIGHT);
    var inf=getUserInfo();
    inf.pos2str[x]=time;
}
function setUser(file) {
    var files=file.replace(/^\//,"").split("-");
    var user=files[0]+"-"+files[1]
    curUser=user;
    //0123-cho-data-time.txt
    var row=$("<tr>").appendTo("#tl");
    $("<td>").text(curUser).appendTo(row);
    curcv=$("<canvas>").attr({width:800,height:30,"data-user":curUser});
    var inf=getUserInfo();
    curcv.click(function (e) {
        //console.log(inf.pos2str);
        var x=(e.clientX-curcv.offset().left);
        for (var i=1;i<10; i++) {
            if (inf.pos2str[x]) {
                window.open("grep.php?file="+user+"&word="+inf.pos2str[x]+"#center");
                break;
            }
            x+=i*(i%2*2-1);
        }
    });
    $("<td>").append(curcv).appendTo(row);
}
function setColor(col) {
    var ctx=curcv[0].getContext("2d");
    ctx.fillStyle=col;
    lineY=(col=="red"?HEIGHT/2:0);
}