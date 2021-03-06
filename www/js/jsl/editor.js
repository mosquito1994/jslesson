requirejs(["Util", "Tonyu", "FS", "FileList", "FileMenu",
           "showErrorPos", "fixIndent",  "ProjectCompiler",
           "Shell","ShellUI","KeyEventChecker",
           "runtime", "searchDialog","StackTrace",
           "UI","UIDiag","WebSite","exceptionCatcher","Tonyu.TraceTbl",
           "Columns","assert","Menu","TError","DeferredUtil","Sync","RunDialog","RunDialog2",
           "LocalBrowser","logToServer","logToServer2","zip","SplashScreen","Auth"
          ],
function (Util, Tonyu, FS, FileList, FileMenu,
          showErrorPos, fixIndent, TPRC,
          sh,shui,  KeyEventChecker,
          rt, searchDialog,StackTrace,
          UI, UIDiag,WebSite,EC,TTB,
          Columns,A,Menu,TError,DU,Sync,RunDialog,RunDialog2,
          LocalBrowser,logToServer,logToServer2,zip,SplashScreen,Auth
) {
    if (location.href.match(/localhost/)) {
        console.log("assertion mode strict");
        A.setMode(A.MODE_STRICT);
    } else {
        console.log("assertion mode defensive");
        A.setMode(A.MODE_DEFENSIVE);
    }
    var P=FS.PathUtil;
    var dir=Util.getQueryString("dir");
    if (!dir) {
        alert("dir is not specified");
        return;
    }
    var curProjectDir=FS.get(dir);
    var curPrj=TPRC(curProjectDir);
    var isFirefox=navigator.userAgent.indexOf("Firefox")>=0;
    var isChrome=navigator.userAgent.indexOf("Chrome")>=0;
    var isChrome53=navigator.userAgent.indexOf("Chrome/53")>=0;
    var langList={
    	"js":"JavaScript",
    	"c":"C",
    	"dtl":"Dolittle"
    };
    var helpURL;
    var unsaved=false;
    var unsynced=false;
    var Builder;
    var builder;
    var ram;
    function showToast(msg){
    	$("#toastArea").text(msg);
    	setTimeout(function(){
    		$("#toastArea").text("");
    	},5000);
    }
    function sync() {
    	unsaved=false;
	    //unsynced=false;
        return Sync.sync(curProjectDir, curProjectDir,{v:true}).then(function(){
            unsynced=false;
            showToast("保存しました");
        }).fail(function (e) {
            if (!e) e="Unknown error";
            logToServer2("SYNC ERROR!\n"+(e.stack || e.responseText || e)+"\nSYNC ERROR END!\n");
            console.log(e);
            alert("保存に失敗しました。");
        });
    }
    function firstSync() {
        return Auth.check().then(sync);
    }
    $.when(DU.documentReady(),firstSync(), DU.requirejs(["ace"])).
    then(ready).fail(function (e) {
        alert("エラー"+e);
        console.log(e.stack);
        SplashScreen.hide();
    });

function ready() {
    var F=EC.f;
    $LASTPOS=0;
    //var home=FS.resolve("${tonyuHome}");
    Tonyu.globals.$currentProject=curPrj;
    Tonyu.currentProject=curPrj;
    //var EXT=A(curPrj.EXT);
    var EXT=curPrj.getEXT();
    var HEXT=".html";
    var opt=curPrj.getOptions();
    var lang=opt.language || "js";
    switch (lang){
    case "c":
    	requirejs(["cCompiler"],function(){
    	    console.log("cCom requirejsed");
    	});
    	helpURL="http://bitarrow.eplang.jp/index.php?c_use";
    	break;
    case "js":
    	requirejs(["TJSBuilder"],function(_){
    	    Builder=_;
    	    console.log("tjsb requirejsed");
    	    $("#fullScr").attr("href","javascript:;").text("別ページで表示");
            ram=FS.get("/ram/build/");
            FS.mount(ram.path(),"ram");
            builder=new Builder(curPrj, ram);
    	});
    	helpURL="http://bitarrow.eplang.jp/index.php?javascript";
    	break;
    case "dtl":
    	requirejs(["DtlBuilder"],function(_){
    	    Builder=_;
    	    console.log("dtlb requirejsed");
    	    $("#fullScr").attr("href","javascript:;").text("別ページで表示");
            ram=FS.get("/ram/build/");
            FS.mount(ram.path(),"ram");
            builder=new Builder(curPrj, ram);
    	});
    	helpURL="http://bitarrow.eplang.jp/index.php?dolittle_use"
    	break;
    }
    function makeUI(){
        Columns.make(
              ["div",{id:"fileViewer","class":"col-xs-2"},
                  ["div",{id:"fileItemList"}]
              ],
              ["div",{id:"mainArea","class":"col-xs-10"},
                  ["div",{id:"errorPos"}],
                  ["div",{id:"tabTop"},
                     ["button",{
                         "class":"selTab","data-ext":HEXT,css:{display:lang=="js"?"inline":"none"}
                     },"HTML"],
                     ["button",{
                         "class":"selTab","data-ext":EXT
                     },langList[lang]],
                     ["span",{id:"curFileLabel"}],
                     ["span",{id:"modLabel"}],
                     ["span",{id:"toastArea"}],
                     ["a",{id:"fullScr",href:"javascript:;"}]
                  ],
                  ["div",{id:"progs"}]
              ]/*,
              ["div",{id:"runArea","class":"col-xs-5"},
               ["div","実行結果：",["a",{id:"fullScr",href:"javascript:;"}]],
               ["iframe",{id:"ifrm",width:465,height:465}],
	       ["div",{id:"toastArea"}]
              ]*/
        );
    }
    makeUI();
    function makeMenu() {
        Menu.make({label:"Bit Arrow",id:"home"},
                [
                  //{label:"Bit Arrow"/*,href:"index.html"*/,id:"home"},
                  {label:"ファイル",sub:[
                      {label:"新規",id:"newFile"},
                      {label:"名前変更",id:"mvFile"},
                      {label:"コピー",id:"cpFile"},
                      //{label:"閉じる",id:"closeFile"},
                      {label:"削除", id:"rmFile"}
                  ]},
                  {label:"実行",id:"runMenu",action:run/*sub:[
                      {label:"実行(F9)",id:"runMenu",action:run},
                      {label:"停止(F2)",id:"stopMenu",action:stop},
                  ]*/},
                  {label:"保存",id:"save"},
                  {label:"設定",sub:[
                      {label:"エディタの文字の大きさ",id:"textsize",action:textSize}/*,
                      {label:"エディタモード切替",id:"editorType",action:editorType}*/
                  ]},
                  {label:"使用方法",id:"openHelp"}
                ]
        );
    }
    makeMenu();
    var screenH;
    function onResize() {
        var h=$(window).height()-$("#navBar").height()-$("#tabTop").height();
        h-=20;
        screenH=h;
        var rw=$("#runArea").width();
        $("#progs pre").css("height",h+"px");
        console.log("canvas size",rw,h);
        $("#fileItemList").height(h);
    }
    onResize();
    var desktopEnv=loadDesktopEnv();
    var runMenuOrd=desktopEnv.runMenuOrd;
    var editors={};

    KeyEventChecker.down(document,"bs",F(function (e) {
        A.is(e,"Event");
	    var f=$(":focus");
	    var doConfirm=true;
	    if (f.length>0 && 
	        (
	            (f[0].tagName.toLowerCase()=="input" && 
    	        (!f.attr("type") || f.attr("type")=="text")) || 
	            f[0].tagName.toLowerCase()=="textarea"
	        )
	    ) doConfirm=false;
	    if(doConfirm){
            /*UIDiag.confirm("一つ前のページに戻ります。よろしいですか？").then(function (r) {
                if (r) {
                    history.back();
                }
            });*/
            e.stopPropagation();
            e.preventDefault();
            return false;
	    }
    }));
    KeyEventChecker.down(document,"ctrl+shift+s",function () {
        sh.window();
    });
    KeyEventChecker.down(document,"F9",F(run));
    KeyEventChecker.down(document,"F2",F(function(){
        stop();
        if(progs=getCurrentEditor()) progs.focus();
        //console.log("F2 pressed");
    }));
    KeyEventChecker.down(document,"ctrl+s",F(function (e) {
        A.is(e,"Event");
    	save();
    	e.stopPropagation();
    	e.preventDefault();
    	return false;
    }));
    $(window).resize(F(onResize));
    $("body")[0].spellcheck=false;
    sh.cd(curProjectDir);

    var fl=FileList($("#fileItemList"),{
        topDir: curProjectDir,
        on:{
            select: F(open),
            displayName: dispName
        }
    });
    var FM=FileMenu();
    FM.fileList=fl;
    var sourceFiles={};
    $("#newFile").click(F(function () {
        sourceFiles=curPrj.sourceFiles();
        console.log(sourceFiles);
        FM.create();
    }));
    $("#mvFile").click(F(FM.mv));
    $("#cpFile").click(F(function () {
        var inf=getCurrentEditorInfo();
        if (!inf) {
            alert("コピーしたいファイルを開いてください。");
            return;
        }
        var old=inf.file;
        var oldName=old.truncExt();
        FM.dialogOpt({title:"コピー", name:oldName, action:"cp", onend:function (_new) {
            if (!_new) return;
            var olds=fileSet(old);
            var news=fileSet(_new);
            A(olds.length==news.length,"olds.length==news.length");
            var ci;
            for (var i=0;i<olds.length;i++) {
                if (olds[i].equals(old)) ci=i;
                if (olds[i].exists() && !news[i].exists()) {
                    news[i].copyFrom(olds[i]);
                }
            }
            A.is(ci,Number);
            ls();
            fl.select(news[ci]);
        }});
    }));

    $("#rmFile").click(F(FM.rm));
    $("#closeFile").click(closeCurrentFile);
    function closeCurrentFile() {
        var inf=getCurrentEditorInfo();
        if (!inf) {
            return;
        }
        var f=inf.file;
        var s=fileSet(f);
        s.forEach(function (e) {
            close(e);
        });
    }
    FM.on.close=function (f) {
        var s=fileSet(f);
        var shouldRemove=false;
        s.forEach(function (e) {
            if (!e.exists()) shouldRemove=true;
        });
        s.forEach(function (e) {
            if (shouldRemove && e.exists()) {
                e.rm();
            }
            close(e);
        });
    };
    FM.on.ls=ls;
    FM.on.validateName=fixName;
    FM.on.createContent=function (f) {
        if (f.ext()==EXT || f.ext()==HEXT) {
            fileSet(f).forEach(function (e) {
                if (e.ext()==EXT && !e.exists()) {
                    e.text("// "+langList[lang]+"\n");
                    if(lang=="js") e.text("// "+langList[lang]+"\n// ここで扱われるJavaScriptは通常のJavaScriptとは異なります。詳しくは使用方法をご覧ください。\n");
                } else if (e.ext()==HEXT  && !e.exists()) {
                    e.text("<html>\n\n</html>");
                } else {
                    e.text("");
                }
            });
        } else {
            f.text("");
        }
    };
    FM.on.displayName=function (f) {
        A.is(f,String);
        var r=dispName(f);
        if (r) {
            return r;
        }
        return f;
    };
    var refactorUI;
    FM.on.rm=function (f) {
        var fs=fileSet(f);
        for (var i=0;i<fs.length;i++) {
            if (fs[i].exists()) fs[i].rm();
            close(fs[i]);
        }
        ls();
        return false;
    };
    FM.on.mv=function (old,_new) {
        var olds=fileSet(old);
        var news=fileSet(_new);
        A(olds.length==news.length,"olds.length==news.length");
        var ci;
        for (var i=0;i<olds.length;i++) {
            if (olds[i].equals(old)) ci=i;
            if (olds[i].exists() && !news[i].exists()) {
                news[i].moveFrom(olds[i]);
            }
            close(olds[i]);
        }
        A.is(ci,Number);
        ls();
        fl.select(news[ci]);
        return false;
    };
    F(FM.on);
    console.log("listing", curProjectDir.path());
    fl.ls(curProjectDir);
    console.log("listing", curProjectDir.path(),"done");
    function ls(){
        fl.ls(curProjectDir);
    }
    function dispName(name) {
        A.is(name,String);
        //var name=f.name();
        if (P.startsWith(name,".")) return null;
        if (P.isDir(name)) return name;
        if (P.endsWith(name,EXT) /*|| f.endsWith(HEXT)*/) return P.truncExt(name);
        return null;
    }
    function fixName(name, options) {
        A.is(arguments,[String]);
        var upcased=false;
        if (name.match(/^[a-z]/)) {
            name= name.substring(0,1).toUpperCase()+name.substring(1);
            upcased=true;
        }
        if (name.match(/^[A-Z_][a-zA-Z0-9_]*$/)) {
            if (sourceFiles[name]) {
                return {ok:false, reason:name+"はシステムで利用されている名前なので使用できません"};
            }
            if (upcased) {
                //name= name.substring(0,1).toUpperCase()+name.substring(1);
                return {ok:true, file: curProjectDir.rel(name+EXT), note: "先頭を大文字("+name+") にして作成します．"};
            }
            return {ok:true, file: curProjectDir.rel(name+EXT)};
        } else {
            return {ok:false, reason:"名前は，半角英数字とアンダースコア(_)のみが使えます．先頭は英大文字にしてください．"};
        }
    }
    function getCurrentEditorInfo() {
        var f=fl.curFile();
        if (!f) return null;
        A.is(f,"SFile");
        return editors[f.path()];//A.is(editors[f.path()],"EditorInfo?");
    }
    function getCurrentEditor() {//->AceEditor?
        var i=getCurrentEditorInfo();
        if (i) return A.is(i.editor,"AceEditor");
        return null;
    }
    function displayMode(mode) {
        // mode == run     compile_error     runtime_error    edit
        var prog=getCurrentEditor();
        switch(mode) {
        case "run":
            if (prog) prog.blur();
            showErrorPos($("#errorPos"));
            break;
        case "compile_error":
            SplashScreen.hide();
            break;
        case "runtime_error":
            SplashScreen.hide();
            break;
        case "edit":
            //if(progs=getCurrentEditor()) progs.focus();
            break;
        }
    }
    function stop() {
        //curPrj.stop();
        if(curth){
            try {
                curth.kill();
            }catch(e) {
                //IE shows error "解放されたスクリプトからコードを実行できません。";
                console.log(e);
            }
            curth=null;
        }
        displayMode("edit");
    }
    var curName,runURL;
    $("#fullScr").click(function () {
        if (lang=="dtl" || lang=="js") {
            var inf=getCurrentEditorInfo();
            if (!inf) {
                alert("実行したファイルを選んでください");
            }
            save();
            sync();
            if (builder && inf) {
                var curFile=inf.file;
                var curFiles=fileSet(curFile);
                var curHTMLFile=curFiles[0];
                var curLogicFile=curFiles[1];

                var pub=Auth.publishedDir(curProjectDir.name());
                //var pub=Auth.remotePublics()/*FS.get("/public/")*/.rel(curProjectDir.name());
                SplashScreen.show();
                DU.timeout(0).then(function () {
                    //alert(curLogicFile.path());
                    return builder.build({mainFile:curLogicFile});    
                }).then(function () {
                    //if (window.SplashScreen) window.SplashScreen.progress("Upload contents...");
                    return builder.upload(pub);                    
                }).then(function () {
                    SplashScreen.hide();
                    var cv=$("<div>");
                    cv.dialog();
                    runURL=Auth.publishedURL(curProjectDir.name())+curHTMLFile.name();
                    //runURL=WebSite.published+Auth.class+"/"+
                    //Auth.user+"/public/"+pub.name()+curHTMLFile.name();
                    //alert("synced "+runURL);
                    cv.append($("<div>").append(
                        $("<a>").attr({target:"runit",href:runURL}).text("別ページで開く")
                    ));
                    cv.append($("<div>").qrcode({width:200,height:200,text:runURL}));
                    return sync();
                }).fail(function (e) {
                    Tonyu.onRuntimeError(e);
                    SplashScreen.hide();
                });
            }
        } else {
            if (runURL) {
                var cv=$("<div>");
                cv.dialog();
                sync().then(function () {
                    cv.append($("<div>").append(
                            $("<a>").attr({target:"runit",href:runURL}).text("別ページで開く")
                    ));
                    cv.append($("<div>").qrcode(runURL));
                });
            }
        }
    });
    function run() {//run!!
        var inf=getCurrentEditorInfo();
        if (!inf) {
            alert("実行したいファイルを開いてください。");
            return;
        }
        var curFile=inf.file;
        var curFiles=fileSet(curFile);
        var curHTMLFile=curFiles[0];
        var curJSFile=curFiles[1];
	    window.sendResult=function(resDetail){
            logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),"C Run",resDetail,"C");
        }
        stop();
        save();
        // display=none
        $("[name=runtimeErrorDialog]").parent().css("display","none");
        displayMode("run");
        if(lang=="js"){
    	    //logToServer("//"+curJSFile.path()+"\n"+curJSFile.text()+"\n//"+curHTMLFile.path()+"\n"+curHTMLFile.text());
            SplashScreen.show();
            //RunDialog2 (new version)
            try {
                DU.timeout(0).then(function () {
                    return builder.build({mainFile:curJSFile});    
                }).then(function () {
                    //console.log(ram.ls());
                    var indexF=ram.rel(curHTMLFile.name());
                    RunDialog2.show(indexF,
                    {height:screenH-50,toEditor:focusToEditor,font:desktopEnv.editorFontSize||18});
                    logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),"JS Run","実行しました","JavaScript");
                }).fail(function (e) {
                    console.log(e.stack);
    	            if (e.isTError) {
    	                console.log("showErr: run",e);
    	                showErrorPos($("#errorPos"),e);
    	                displayMode("compile_error");
                        logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),"JS Compile Error",e.src+":"+e.pos+"\n"+e.mesg,"JavaScript");
    	            }else{
    	                Tonyu.onRuntimeError(e);
    	            }
                }).always(function () {
        	        //$("#fullScr").attr("href","javascript:;").text("別ページで実行");
                    SplashScreen.hide();
                });
            }catch(e) {
                console.log(e.stack);
            }
            return sync();
            /*
            QR code
            sync
            */
            
    	}else if(lang=="c"){
    	    //logToServer("//"+curJSFile.path()+"\n"+curJSFile.text());
    		var compiledFile=curPrj.getOutputFile();
    		var log={};
    		try{
    			compile(curJSFile,compiledFile,log);
    	        	runURL=location.href.replace(/\/[^\/]*\?.*$/,
    	        	        "/js/ctrans/runc.html?file="+compiledFile.path()
    	        	);
    			//$("#ifrm").attr("src",runURL);
    			    RunDialog.show("src",runURL,
    			    {height:screenH-50,toEditor:focusToEditor,font:desktopEnv.editorFontSize||18});
    		        //RunDialog2.show(runURL,
    			    //{height:screenH-50,toEditor:focusToEditor,font:desktopEnv.editorFontSize||18});
    		        $("#fullScr").attr("href","javascript:;").text("別ページで表示");
    		        $("#qr").text("QR");
    		}catch(e){
    			//logToServer("COMPILE ERROR!\n"+e+"\nCOMPILE ERROR END!");
    			logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),"C Compile Error",e,"C");
    			alert(e);
    		}
            return sync();
    	}else if(lang=="dtl"){
    	    try {
                SplashScreen.show();
        	    //logToServer("//"+curJSFile.path()+"\n"+curJSFile.text()+"\n//"+curHTMLFile.path()+"\n"+curHTMLFile.text());
    	        $("#fullScr").attr("href","javascript:;").text("別ページで表示");
                DU.timeout(0).then(function () {
                    return builder.build({mainFile:curJSFile});    
                }).then(function () {
                    var indexF=ram.rel(curHTMLFile.name());
                    logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),"Dolittle Run","実行しました","Dolittle");
                    return RunDialog2.show(indexF,
                    {height:screenH-50,toEditor:focusToEditor,font:desktopEnv.editorFontSize||18});
                }).fail(function (e) {
                    //console.log("FAIL", arguments);
                    Tonyu.onRuntimeError(e);
                    console.log("DTLFAIL",e.stack);
                }).always(function () {
                    SplashScreen.hide();
                    return sync();
                });
            }catch(e) {
	            if(e) console.log(e.stack);
                SplashScreen.hide();
            }
    	}
    }
    window.moveFromFrame=function (name) {
        A.is(name,String);
        var f=curProjectDir.rel(name);
        if (f.exists()) {
            fl.select(f);
            run();
        }
    };
    var curFrameRun;
    var curth;
    window.setupFrame=function (r) {
        A.is(r,Function);
        //curFrameRun=r;
        var inf=getCurrentEditorInfo();
        var ht="";
        var curFile=inf.file;
        var curFiles=fileSet(curFile);
        var curHTMLFile=curFiles[0];
        var curJSFile=curFiles[1];
        var ht=curHTMLFile.text();
        var f=curPrj.getOutputFile();
        var js=f.text();
        curth=r(ht,js, curName);
        SplashScreen.hide();
    };
    var alertOnce;
    alertOnce=function (e) {
        alert(e);
        alertOnce=function(){};
    };
    window.onerror=function (a,b,c,d,e) {
        if (!e) return;
        return Tonyu.onRuntimeError(e);
    };
    var bytes=function(s) {
        try {
            var r="",noconv;
            for(var i=0;i<s.length;i++) {
                var c=s.charCodeAt(i);
                if (c>=256) noconv=true;
                r+="%"+(c.toString(16)); 
            } 
            return noconv?s:decodeURIComponent(r); 
        }catch(e) {
            console.log(e, s);
            return s;
        }
    };
    EC.handleException=Tonyu.onRuntimeError=function (e) {
        var inf=getCurrentEditorInfo();
        var curFile=inf.file;
        var curFiles=fileSet(curFile);
        var curHTMLFile=curFiles[0];
        var curJSFile=curFiles[1];
        Tonyu.globals.$lastError=e;
        //A.is(e,Error);// This will fail when error from iframe.
        A(e,"Error is empty");
        var t=curPrj.env.traceTbl;
        var te;
        var tid = t.find(e) || t.decode($LASTPOS); // user.Main:234
        if (tid) {
            te=curPrj.decodeTrace(tid);
        }
        console.log("onRunTimeError:stackTrace1",e.stack,te,$LASTPOS);
        if (te) {
            te.mesg=e;
            if (e.pluginName) {
                alert(e.message);
            } else {
                var diag=showErrorPos($("#errorPos"),te);
                displayMode("runtime_error");
                /*$("#errorPos").find(".quickFix").append(
                        UI("button",{on:{click: function () {
                            setDiagMode(true);
                            diag.dialog("close");
                            run();
                        }}},"診断モードで実行しなおす"));*/
            }
            stop();
            //logToServer("JS Runtime Error!\n"+te.src+":"+te.pos+"\n"+te.mesg+"\nJS Runtime Error End!");
            logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),langList[lang]+" Runtime Error",te.src+":"+te.pos+"\n"+te.mesg,langList[lang]);
        } else {
            if (isChrome) {
                e.stack=e.stack.split("\n").map(bytes).join("\n");
                //if (isChrome) { s=bytes(s); console.log("CONV",s); }
            }
            if (isFirefox) {
                e.stack=(e+"\n"+e.stack).replace(/\\u([0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f])/g,function (_,c) {
                    return String.fromCharCode("0x"+c);
                });
            }
            var stack = e.stack.split("\n");
            var cve;
            var rc=/:([0-9]+):([0-9]+)/;
            stack.forEach(function (s) {
                if (cve) return;
                var idx=s.indexOf(curProjectDir.path());
                if (idx>0) {
                    s=s.substring(idx);
                    var m=rc.exec(s);
                    cve=FS.PathUtil.name(s.substring(0,m.index))+"の"+
                    m[1]+"行目"+m[2]+"文字目付近でエラーが発生しました";
                    console.log("ERT",s.substring(0,m.index), m[1], m[2]);
                }
            });
            UI("div",{title:"Error",name:"runtimeErrorDialog"},"["+(cve||e)+"]",
            //["button",{on:{click:function(){console.log("clicked");$("#reConsole"+reDialog).text(e.stack);}}},"詳細"],
            //["pre",{id:"reConsole"+reDialog},stack[0]+"\n"+stack[1]]).dialog({width:800});
            ["button",{on:{click:function(){console.log("clicked");$(this).parent("div").children("pre").text(e.stack);}}},"詳細"],
            ["pre",{id:"reConsole"},stack[0]+"\n"+stack[1]],
            ["button",{on:{click:function(){console.log("onerr");$(this).parent().parent().css("display","none");}}},"閉じる"]).dialog({width:800});
            stop();
            //logToServer(e.stack || e);
            logToServer2(curJSFile.path(),curJSFile.text(),curHTMLFile.text(),langList[lang]+" Runtime Error",e.stack || e,langList[lang]);
        }
    };
    $("#search").click(F(function () {
        console.log("src diag");
        searchDialog.show(curProjectDir,function (info){
            fl.select(info.file);
            setTimeout(function () {
                var prog=getCurrentEditor();
                if (prog) prog.gotoLine(info.lineNo);
            },50);
        });
    }));
    function close(rm) { // rm or mv
        var i=editors[rm.path()]; //getCurrentEditorInfo();
        if (i) {
            A.is(i,"EditorInfo");
            i.editor.destroy();
            i.dom.remove();
            delete editors[rm.path()];
            //alert(editors[rm.path()]);
        }
    }
    function fixZSpace(prog) {
        A.is(prog,"AceEditor");
        var prev=prog.getValue();
        var fixed=prev.replace(/　/g,"  ");
        if (fixed!==prev) {
            var cur=prog.getCursorPosition();
            prog.setValue(fixed);
            prog.clearSelection();
            prog.moveCursorTo(cur.row, cur.column);
        }
    }
    function fixEditorIndent(prog) {
        A.is(prog,"AceEditor");
        var prev=prog.getValue();
        var fixed=fixIndent( prev ).replace(/　/g,"  ");
        if (fixed!==prev) {
            var cur=prog.getCursorPosition();
            prog.setValue(fixed);
            prog.clearSelection();
            prog.moveCursorTo(cur.row, cur.column);
        }
    }
    function reloadFromFiles() {
        for (var path in editors) {
            var inf=editors[path];
            var curFile=inf.file; //fl.curFile();
            var prog=inf.editor; //getCurrentEditor();
            if (curFile.exists() && prog) {
                prog.setValue(curFile.text());
                prog.clearSelection();
            }
        }
    }
    function save() {
        var inf=getCurrentEditorInfo();
        if (!inf) return;
        var curFile=inf.file; //fl.curFile();
        var prog=inf.editor; //getCurrentEditor();
        if (curFile && prog && !curFile.isReadOnly()) {
            if (curFile.ext()==EXT) fixEditorIndent(prog);
            else fixZSpace(prog);
            var old=curFile.text();
            var nw=prog.getValue();
            if (old!=nw) {
                curFile.text(nw);
            }
        }
        fl.setModified(false);
    }
    function watchModified() {
        try {
            var inf=getCurrentEditorInfo();
            if (!inf) return;
            var curFile=inf.file; //fl.curFile();
        	var prog=inf.editor;//getCurrentEditor();
        	var mod=(curFile.exists()?curFile.text():"")!=prog.getValue();
        	fl.setModified(mod);
    	    $("#modLabel").text(mod?"(変更あり)":"");
    	    if(mod){
    	        unsaved=true;
    	        unsynced=true;
    	    }else{
    	        unsaved=false;
    	    }
        }catch(e) {
            console.log(e);            
        }
    }
    function fileSet(c) {
        A.is(c,"SFile");
        var n=c.truncExt();
        return [c.up().rel(n+HEXT), c.up().rel(n+EXT)];
    }
    $(".selTab").click(function () {
        var ext=A.is($(this).attr("data-ext"),String);
        var c=fl.curFile();
        if (!c) {
            alert("まず、メニューの「ファイル」→「新規」でファイルを作るか、左のファイル一覧からファイルを選んでください。");
            return;
        }
        var n=c.truncExt();
        var f=c.up().rel(n+ext);
        if (!f.exists()) {
            FM.on.createContent(f);
        }
        fl.select(f);
    });
    setInterval(watchModified,1000);
    var curDOM;
    function open(f) {
        A.is(f,"SFile");
        if (!window.ace) {
            alert("しばらくしてからもう一度開いてください");
            return true;
        }
	// do not call directly !!  it doesnt change fl.curFile. use fl.select instead
        if (f.isDir()) {
            return;
        }
        save();
        //if (isChrome53) closeCurrentFile();
        if (curDOM) curDOM.hide();
        var inf=editors[f.path()];
        $(".selTab").removeClass("selected");
        $(".selTab[data-ext='"+f.ext()+"']").addClass("selected");
        if (!inf) {
            var progDOM=$("<pre>").css("height", screenH+"px").text(f.text()).appendTo("#progs");
            progDOM.attr("data-file",f.name());
            var prog=ace.edit(progDOM[0]);
            if (typeof desktopEnv.editorFontSize=="number") prog.setFontSize(desktopEnv.editorFontSize);
	    else prog.setFontSize(18);
            //prog.setFontSize(20);
            prog.setTheme("ace/theme/eclipse");
            defaultKeyboard=prog.getKeyboardHandler();
            //if(desktopEnv.editorMode=="emacs") prog.setKeyboardHandler("ace/keyboard/emacs");
            //prog.setKeyboardHandler(defaultKeyboard);
            if (f.ext()==EXT && lang=="c") {
                prog.getSession().setMode("ace/mode/c_cpp");
            }
            else if (f.ext()==EXT) {
                prog.getSession().setMode("ace/mode/tonyu");
            }
            if (f.ext()==HEXT) {
                prog.getSession().setMode("ace/mode/html");
            }
            prog.getSession().setUseWrapMode(true);
            editors[f.path()]={file:f , editor: prog, dom:progDOM};
            progDOM.click(F(function () {
                displayMode("edit");
            }));
            prog.setReadOnly(false);
            prog.clearSelection();
            prog.focus();
            curDOM=progDOM;
        } else {
            inf.dom.show();
            inf.editor.focus();
            curDOM=inf.dom;
            //if(desktopEnv.editorMode=="emacs") inf.editor.setKeyboardHandler("ace/keyboard/emacs");
            //else inf.editor.setKeyboardHandler(defaultKeyboard);
        }
        $("#curFileLabel").text(f.truncExt());
    }
    d=function () {
        Tonyu.currentProject.dumpJS.apply(this,arguments);
    };
    function loadDesktopEnv() {
        var d=curProjectDir.rel(".desktop");
        var res;
        if (d.exists()) {
            res=d.obj();
        } else {
            res={};
        }
        if (!res.runMenuOrd) res.runMenuOrd=[];
        return desktopEnv=res;
    }
    function saveDesktopEnv() {
        var d=curProjectDir.rel(".desktop");
        d.obj(desktopEnv);
    }
    $("#prjOptEditor").click(F(function () {
        ProjectOptionsEditor(curPrj);
    }));
    var helpd=null;
    /*$("#refHelp").click(F(function () {
    	if (!helpd) helpd=WikiDialog.create(home.rel("doc/tonyu2/"));
    	helpd.show();
    }));*/
    if (typeof progBar=="object") {progBar.clear();}
    /*$("#rmPRJ").click(F(function () {
        if (prompt(curProjectDir+"内のファイルをすべて削除しますか？削除する場合はDELETE と入力してください．","")!="DELETE") {
            return;
        }
        sh.rm(curProjectDir,{r:1});
        document.location.href="index.html";
    }));
    $("#mvPRJ").click(F(function () {
        var np=prompt("新しいプロジェクトの名前を入れてください", curProjectDir.name().replace(/\//g,""));
        if (!np || np=="") return;
        if (!np.match(/\/$/)) np+="/";
        var npd=curProjectDir.up().rel(np);
        if (npd.exists()) {
            alert(npd+" はすでに存在します");
            return;
        }
        sh.cp(curProjectDir,npd);
        sh.rm(curProjectDir,{r:1});
        document.location.href="project.html?dir="+npd;
    }));*/
    function textSize() {
        var prog=getCurrentEditor();
        var s=prompt("エディタの文字の大きさ", desktopEnv.editorFontSize||18);
        desktopEnv.editorFontSize=parseInt(s);
        if (prog) prog.setFontSize(desktopEnv.editorFontSize||18);
        saveDesktopEnv();
    }
    function editorType() {
        var prog=getCurrentEditor();
        if(prog.getKeyboardHandler()==defaultKeyboard){
            prog.setKeyboardHandler("ace/keyboard/emacs");
            desktopEnv.editorMode="emacs";
        }else{
            prog.setKeyboardHandler(defaultKeyboard);
            desktopEnv.editorMode="ace-default";
        }
        saveDesktopEnv();
        focusToEditor();
    }
    $("#home").click(F(function () {
        save();
    	goHome();
    }));
    $("#runMenu").click(F(run));
    function goHome(){
	console.log("goHome");
	unsynced=false;
	location.href="index.html";
    }
    $("#openHelp").click(function(){
        window.open(helpURL,"helpTab");
    });
    sh.curFile=function () {
        return fl.curFile();
    };
    $(window).on("beforeunload",function(e){
	if(unsynced || unsaved){
	    return "保存されていないデータがあります。\nこれまでの作業を保存するためには一度実行してください。";
	}
    });
    $("#save").click(F(function () {
	save();
	sync();
    }));
    FM.onMenuStart=save;
    function focusToEditor(){
        if(prog=getCurrentEditor()) prog.focus();
    }
    window.getCurrentEditorInfo=getCurrentEditorInfo;
    SplashScreen.hide();
}// of ready
//});// of load ace
});
