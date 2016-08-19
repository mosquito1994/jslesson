define(["UI"], function (UI) {
    var res={};
	res.show=function (prjDir, onOK,options) {
    	var d=res.embed(prjDir,onOK,options);
    	d.dialog({width:600});
	};
	res.embed=function (prjDir, onOK, options) {
	    if (!options) options={};
        if (!res.d) {
            var FType={
                    fromVal: function (val){
                        return val=="" ? null : FS.get(val);
                    },
                    toVal: function (v){ return v ? v.path() : "";}
            };
        	res.d=UI("div",{title:"プロジェクト名の変更"},
        			["div",
        			 ["span","プロジェクト名"],
        			 ["input",{$edit:"name",id:"prjName",value:options.defName||"",
        			     on:{enterkey:function () {
                		     res.d.done();
				 }}}]],
				["div",{css:{"display":"none"}},
        			 ["span","プログラミング言語"],
        			 ["select",{$edit:"lang",id:"prjLang"},
        			 ["option",{selected:true,value:"js"},"JavaScript"],
        			 ["option",{value:"dtl"},"ドリトル"],
        			 ["option",{value:"c"},"C"]],
        			 ["span","言語を選択してください"]
				],
         			["div",{css:{"display":"none"}},
        			 ["span","親フォルダ"],
        			 ["input",{$edit:{name:"parentDir",type:FType}}]],
        			 ["div",{css:{"display":"none"}},
        			   ["span","作成先フォルダ："],
        			   ["span",{$var:"dstDir"}]
        			  ],
                 ["div", {$var:"validationMessage", css:{color:"red"}}],
                 ["button", {$var:"OKButton", on:{click: function () {
                	 res.d.done();
                 }}}, "OK"]
            );
        }
        var d=res.d;
        var model={name:options.defName||"",lang:"js", parentDir:prjDir};
        d.$edits.load(model);
    	d.$edits.validator.on.validate=function (model) {
    		if (model.name=="") {
    			this.addError("name","名前を入力してください");
    			return;
    		}
    		model.dstDir=model.parentDir.rel(model.name+"/");
            if (model.dstDir.rel("options.json").exists() ) {
                this.addError("name","このフォルダはすでに存在します");
                return;
            }
    		this.allOK();
    		d.$vars.dstDir.text(model.dstDir+"");
    	};
    	d.done=function () {
    	    if (d.$edits.validator.isValid()) {
                onOK(model);
                d.dialog("close");
    	    }
    	};
    	return d;
    };
    return res;
});