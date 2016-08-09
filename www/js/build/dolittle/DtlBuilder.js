define(["assert","DeferredUtil","wget", "dolittle/minimal","IndentBuffer","Sync","FS","SplashScreen"], 
function (A,DU,wget,dtlParser,IndentBuffer,Sync,FS,SplashScreen) {
    DtlBuilder=function (prj, dst) {
        this.prj=prj;// TPRC
        this.dst=dst;// SFile in ramdisk
    };
    /*var images=["99.gif", "akazukin.gif", "apple.png", "arrow0.png", 
    "arrow1.png", "arrow2.png", "arrow3.png", "ayumi.gif", 
    "ayumi.png", "ayumiAka.gif", "ayumiAo.gif", "ayumiBlue.png", 
    "ayumiKiiro.gif", "ayumiRed.png", "ayumiYellow.png", 
    "ball.png", "base.png", "beetle.png", "bluefish.png", 
    "book.png", "car.png", "clear.png", "copy.png",
    "crab.png", "cut.png", "ecl.png", "editAdd.png", "fish.png", 
    "heri.gif", "inputPad.png", "kuno.gif", "kuno.png", 
    "mapchip.png", "myurobo.png", "neko.png", "neko1.png", 
    "neko2.png", "niwa.gif", "nowprint.png", "paste.png", 
    "pen.png", "rabbitBlue.png", "rabbitGreen.png", 
    "rabbitRed.png", "rabbitYellow.png", "raceBlue.png", 
    "raceGreen.png", "raceRed.png", "raceYellow.png", 
    "redo.png", "rocket.gif", "runner.png", "Sample.png", 
    "server.png", "soccer.png", "sound.png", "star.png", 
    "tnu.ico", "tonbo.gif", "tonyu.png", "trumpet.png", 
    "tulip.png", "ui-icons_888888_256x240.png", "undo.png", "usa.gif"].map(
        function (n) {return "images/"+n;});*/
    var libs=["jquery-1.12.1","require"].map(function (n) {
        return "lib/"+n+".js";
    });
    var dtlibs=["lib","polyk","devicemotion","gps",
    "Vec2","Actor","Group","UI","Color","Timer","Util","Turtle","Figure","DOM","Japanese"].map(
        function (n) {
            return "lib/dtl/"+n+".js";
        }
    );
    var p=DtlBuilder.prototype;
    p.progress=function (m) {
        if (window.SplashScreen) window.SplashScreen.progress(m);
    };
    p.dlFiles=function () {
        var dst=this.dst;
        var urls=[];
        //"lib/jquery-1.12.1.js",
        //"lib/require.js","lib/dtl/lib.js","lib/dtl/polyk.js"];
        urls=urls.concat(libs);
        urls=urls.concat(dtlibs);
        //urls=urls.concat(images);
        var base="runtime/";
        var args=urls.map(function (url) {
            var dstf=dst.rel(url);
            if (!dstf.exists()) return wget(base+url, dstf);
        });
        return $.when.apply($,args);
    };
    p.genHTML=function (f) {
        this.progress("generate "+f.src.html.name());
        //var curHTMLFile=d.rel(name+".html");
        var dp=new DOMParser;
        var dom=dp.parseFromString(f.src.html.text(),"text/html");
        var html=dom.getElementsByTagName("html")[0];
        var head=dom.getElementsByTagName("head")[0];
        var body=dom.getElementsByTagName("body")[0];
        $(head).append($("<meta>").attr("charset","UTF-8"));
        $(head).append($("<script>").text("window.runtimePath='"+WebSite.runtime+"';"));

        libs.concat(dtlibs).map(function (r) {
            return WebSite.runtime+r;
        }).concat([f.name+".js"]).forEach(function (src) {
            var nn=document.createElement("script");
            nn.setAttribute("charset","utf-8");
            nn.setAttribute("src",src+"?"+requirejs.__urlPostfix);
            body.appendChild(nn);
        });
        return f.dst.html.text("<!DOCTYPE HTML>\n<html>"+html.innerHTML+"</html>");
    };
    function isNewer(a,b) {
        if (!a.exists()) return false;
        return a.lastUpdate()>b.lastUpdate();
    }   
    p.build=function () {
        var curPrj=this.prj;
        var dst=this.dst;
        var t=this;
        var files=[];
        //var tr=curPrj.dir.getDirTree({style:"no-recursive"});
        return DU.each(curPrj.dir.ls(),function (n) {
            if (FS.PathUtil.ext(n)!=".html")  return;
            var f=curPrj.dir.rel(n);
            var name=f.truncExt();
            var html=f;
            var dtl=f.up().rel(name+".dtl");
            if (!dtl.exists()) return;
            files.push({name:name,
                src:{html:html,dtl:dtl},
                dst:{
                    html:dst.rel(name+".html"),
                    js:dst.rel(name+".js"),
                    map: dst.rel(name+".js.map")
                }
            });
            return SplashScreen.waitIfBusy();
        }).then(DU.tr(function () {
            return DU.each(files,function (f) {
                t.progress("Transpile "+f.src.dtl.name());
                if (isNewer(f.dst.js, f.src.dtl)) return SplashScreen.waitIfBusy();
                var buf=IndentBuffer({dstFile:f.dst.js,mapFile:f.dst.map});
                buf.setSrcFile(f.src.dtl);
                var js=dtlParser.parse(f.src.dtl.text(),{indentBuffer:buf,src:f.src.dtl.name()});
                buf.close();
                return SplashScreen.waitIfBusy();
            });
        })).then(DU.tr(function() {
            return DU.each(files,function (f) {
                if (isNewer(f.dst.html, f.src.html)) return SplashScreen.waitIfBusy();
                t.genHTML(f);
                return SplashScreen.waitIfBusy();
            });
        }));         
    };
    p.upload=function (pub) {
        return Sync.sync(this.dst,pub);  
    };
    return DtlBuilder;
});