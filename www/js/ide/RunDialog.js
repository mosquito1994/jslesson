define(["UI","DiagAdjuster"],function (UI,DA) {
    var res={};
    res.show=function (src, runURL, options) {
        options=options||{};
        window.dialogClosed=false;
        var d=res.embed(src, runURL, options);
        d.dialog({width:600,position: { my: "center top", at: "right bottom"},
            close:function(){
		        window.dialogClosed=true;
		        $("#ifrmDlg").remove();
		        if(typeof options.toEditor == "function") options.toEditor();
	        },
            resize:function(e,u){
                //console.log(u.size);
                //$("#iBrowser").css({width:u.size.width-50,height:u.size.height-120});
                //$("#ifrmDlg").attr({width:u.size.width-50,height:u.size.height-120});
                if (res.da) res.da.handleResize();
            }
        });//,height:options.height?options.height-50:400});
    };
    res.embed=function (src, runURL, options) {
        if (!options) options={};
        if (!res.d) {
            res.d=UI("div",{title:"実行画面ダイアログ",css:{"overflow":"hidden"}},
                    ["div",{id:"iBrowser"},
                          ["iframe",{id:"ifrmDlg",width:570,height:options.height||400,src:runURL}]
                    ],
                    ["button", {type:"button",$var:"OKButton", on:{click: function () {
                        res.d.dialog("close");
                    }}}, "OK"]
            );
            res.da=new DA(res.d);
            res.da.afterResize=function (d) {
                $("#ifrmDlg").attr({width:d.width(),height:d.height()-res.d.$vars.OKButton.height()});
            };            
        }else{
            $("#ifrmDlg").remove();
		    $("#iBrowser").append(UI("iframe",{id:"ifrmDlg",width:570,height:options.height||400,src:runURL}));
	    }
	    
        $("#ifrmDlg").attr(src,runURL);
        //if($("#ifrmDlg")[0]) console.log($("#ifrmDlg")[0].contentWindow.document.body);
        if($("#ifrmDlg")[0]) {
            var cons=$("#ifrmDlg")[0].contentWindow.document.getElementById("console");
            if (cons) cons.style.fontSize=options.font+"px";
        }
        var d=res.d;
        return d;
    };
    return res;
});