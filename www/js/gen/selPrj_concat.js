define('extend',[],function (){
   return function extend(d,s) {
      for (var i in s) {d[i]=s[i];} 
   };
});

define('assert',[],function () {
    var Assertion=function(failMesg) {
        this.failMesg=flatten(failMesg || "Assertion failed: ");
    };
    Assertion.prototype={
        fail:function () {
            var a=$a(arguments);
            a=flatten(a);
            a=this.failMesg.concat(a);
            console.log.apply(console,a);
            throw new Error(a.join(" "));
        },
        subAssertion: function () {
            var a=$a(arguments);
            a=flatten(a);
            return new Assertion(this.failMesg.concat(a));
        },
        assert: function (t,failMesg) {
            if (!t) this.fail(failMesg);
            return t;
        },
        eq: function (a,b) {
            if (a!==b) this.fail(a,"!==",b);
            return a;
        },
        is: function (value,type) {
            var t=type,v=value;
            if (t==null) return t;
            if (t._assert_func) {
                t._assert_func.apply(this,[v]);
                return value;
            }
            this.assert(value!=null,[value, "should be ",t]);
            if (t instanceof Array || (typeof global=="object" && typeof global.Array=="function" && t instanceof global.Array) ) {
                if (!value || typeof value.length!="number") {
                    this.fail(value, "should be array:");
                }
                var self=this;
                for (var i=0 ;i<t.length; i++) {
                    var na=self.subAssertion("failed at ",value,"[",i,"]: ");
                    na.is(v[i],t[i]);
                }
                return value;
            }
            if (t===String || t=="string") {
                this.assert(typeof(v)=="string",[v,"should be a string "]);
                return value;
            }
            if (t===Number || t=="number") {
                this.assert(typeof(v)=="number",[v,"should be a number"]);
                return value;
            }
            if (t instanceof RegExp || (typeof global=="object" && typeof global.RegExp=="function" && t instanceof global.RegExp)) {
                this.is(v,String);
                this.assert(t.exec(v),[v,"does not match to",t]);
                return value;
            }
            if (typeof t=="function") {
                this.assert((v instanceof t),[v, "should be ",t]);
                return value;
            }
            if (t && typeof t=="object") {
                for (var k in t) {
                    var na=this.subAssertion("failed at ",value,".",k,":");
                    na.is(value[k],t[k]);
                }
                return value;
            }
            this.fail("Invaild type: ",t);
        },
        ensureError: function (action, err) {
            try {
                action();
            } catch(e) {
                if(typeof err=="string") {
                    assert(e+""===err,action+" thrown an error "+e+" but expected:"+err);
                }
                console.log("Error thrown successfully: ",e.message);
                return;
            }
            this.fail(action,"should throw an error",err);
        }
    };
    /*var assert=function () {
      var a=assert.a(arguments);
      var t=a.shift();
      if (!t) assert.fail(a);
      return true;
   };*/
    $a=function (args) {
        var a=[];
        for (var i=0; i<args.length ;i++) a.push(args[i]);
        return a;
    };
    var top=new Assertion;
    var assert=function () {
        try {
            return top.assert.apply(top,arguments);
        } catch(e) {
            throw new Error(e.message);
        }
    };
    assert.is=function () {
        try {
            return top.is.apply(top,arguments);
        } catch(e) {
            throw new Error(e.message);
        }
    };
    assert.eq=function () {
        try {
            return top.eq.apply(top,arguments);
        } catch(e) {
            throw new Error(e.message);
        }
    };
    assert.ensureError=function () {
        try {
            return top.ensureError.apply(top,arguments);
        } catch(e) {
            throw new Error(e.message);
        }
    };
    assert.fail=top.fail.bind(top);
    /*
   assert.fail=function () {
      var a=assert.a(arguments);
      a=flatten(a);
      a.unshift("Assertion failed: ");
      console.log.apply(console,a);
      throw new Error(a.join(" "));
   };
   assert.is=function (value, type, mesg) {
      var t=type,v=value;
      mesg=mesg||[];
      if (t==null) return true;
      assert(value!=null,mesg.concat([value, "should not be null/undef"]));
      if (t instanceof Array) {
          if (!value || typeof value.length!="number") {
              assert.fail(mesg.concat([value, "should be array:", type]));
          }
          t.forEach(function (te,i) {
              assert.is(value[i],te,mesg.concat(["failed at ",value,"[",i,"]: "]));
          });
          return;
      }
      if (t===String || t=="string") {
          return assert(typeof(v)=="string",
          mesg.concat([v,"should be string "]));
      }
      if (t===Number || t=="number") {
          return assert(typeof(v)=="number",
          mesg.concat([v,"should be number"]));
      }
      if (t instanceof Object) {
          for (var k in t) {
              assert.is(value[k],t[k],mesg.concat(["failed at ",value,".",k,":"]));
          }
          return true;
      }
      if (t._assert_func) {
          return t._assert_func(v,mesg);
      }
      return assert(v instanceof t,
      mesg.concat([v, "should be ",t]));
   };*/
    assert.f=function (f) {
        return {
            _assert_func: f
        };
    };
    assert.and=function () {
        var types=$a(arguments);
        assert(types instanceof Array);
        return assert.f(function (value) {
            var t=this;
            for (var i=0; i<types.length; i++) {
                t.is(value,types[i]);
            }
        });
    };
    function flatten(a) {
        if (a instanceof Array) {
            var res=[];
            a.forEach(function (e) {
                res=res.concat(flatten(e));
            });
            return res;
        }
        return [a];
    }
    function isArg(a) {
        return "length" in a && "caller" in a && "callee" in a;
    };
    return assert;
});

define('PathUtil',["assert"],function (assert) {
function endsWith(str,postfix) {
    assert.is(arguments,[String,String]);
    return str.substring(str.length-postfix.length)===postfix;
}
function startsWith(str,prefix) {
    return str.substring(0, prefix.length)===prefix;
}
var driveLetter=/^([a-zA-Z]):/;
var PathUtil;
var Path=assert.f(function (s) {
    this.is(s,String);
    this.assert( PathUtil.isPath(s) , [s, " is not a path"]);
});
var Absolute=assert.f(function (s) {
    this.is(s,String);
    this.assert( PathUtil.isAbsolutePath(s) , [s, " is not a absolute path"]);
});
var Relative=assert.f(function (s) {
    this.is(s,String);
    this.assert( !PathUtil.isAbsolutePath(s) , [s, " is not a relative path"]);
});
var AbsDir=assert.and(Dir,Absolute);

var Dir=assert.f(function (s) {
    this.is(s,Path);
    this.assert( PathUtil.isDir(s) , [s, " is not a directory path"]);
});
var File=assert.f(function (s) {
    this.is(s,Path);
    this.assert( !PathUtil.isDir(s) , [s, " is not a file path"]);
});

var SEP="/";
PathUtil={
    Path: Path,Absolute:Absolute, Relative:Relative, Dir:Dir,File:File,
    AbsDir:AbsDir,
    SEP: SEP,
    endsWith: endsWith, startsWith:startsWith,
    hasDriveLetter: function (path) {
        return driveLetter.exec(path);
    },
    isPath: function (path) {
    	assert.is(arguments,[String]);
		return !path.match(/\/\//);
    },
    isRelativePath: function (path) {
		assert.is(arguments,[String]);
		return PathUtil.isPath(path) && !PathUtil.isAbsolutePath(path);
    },
    isAbsolutePath: function (path) {
		assert.is(arguments,[String]);
		return PathUtil.isPath(path) &&
		(PathUtil.startsWith(path,SEP) || PathUtil.hasDriveLetter(path));
    },
    isDir: function (path) {
		assert.is(arguments,[Path]);
        return endsWith(path,SEP);
    },
	splitPath: function (path) {
		assert.is(arguments,[Path]);
	    var res=path.split(SEP);
        if (res[res.length-1]=="") {
            res[res.length-2]+=SEP;
            res.pop();
        }
        return res;
    },
    name: function(path) {
		assert.is(arguments,[String]);
        return PathUtil.splitPath(path).pop();
    },
    ext: function(path) {
		assert.is(arguments,[String]);
        var n = PathUtil.name(path);
        var r = (/\.[a-zA-Z0-9]+$/).exec(n);
        if (r) return r[0];
        return null;
    },
    truncExt: function(path, ext) {
		assert.is(path,String);
        var name = PathUtil.name(path);
        ext=ext || PathUtil.ext(path);
        assert.is(ext,String);
        return name.substring(0, name.length - ext.length);
    },
    truncSEP: function (path) {
		assert.is(arguments,[Path]);
		if (!PathUtil.isDir(path)) return path;
		return path.substring(0,path.length-1);
    },
    endsWith: function(path, postfix) {
		assert.is(arguments,[String,String]);
        return endsWith(PathUtil.name(path), postfix);
    },
    parent: function(path) {
		assert.is(arguments,[String]);
        return PathUtil.up(path);
    },
    rel: function(path,relPath) {
		assert.is(arguments,[AbsDir, Relative]);
    	var paths=PathUtil.splitPath(relPath);
        var resPath=path;
        resPath=resPath.replace(/\/$/,"");
        var t=PathUtil;
        paths.forEach(function (n) {
             if (n==".." || n=="../") resPath=t.up(resPath);
             else {
                 resPath=resPath.replace(/\/$/,"");
                 resPath+=SEP+(n=="."||n=="./" ? "": n);
             }
        });
        return resPath;
    },
    relPath: function(path,base) {
		assert.is(arguments,[AbsDir,AbsDir]);
        if (path.substring(0,base.length)!=base) {
            return "../"+PathUtil.relPath(path, this.up(base));
        }
        return path.substring(base.length);
    },
    up: function(path) {
		assert.is(arguments,[Path]);
        if (path==SEP) return null;
        var ps=PathUtil.splitPath(path);
        ps.pop();
        return ps.join(SEP)+SEP;
    }
};
return PathUtil;
});
define('MIMETypes',[], function () {
   return {
      ".png":"image/png",
      ".gif":"image/gif",
      ".jpeg":"image/jpeg",
      ".jpg":"image/jpeg",
      ".ico":"image/icon",
      ".mp3":"audio/mp3",
      ".ogg":"audio/ogg",
      ".txt":"text/plain",
      ".html":"text/html",
      ".htm":"text/html",
      ".css":"text/css",
      ".js":"text/javascript",
      ".json":"text/json",
      ".desktop":"text/json",
      ".zip":"application/zip",
      ".swf":"application/x-shockwave-flash",
      ".pdf":"application/pdf",
      ".doc":"application/word",
      ".xls":"application/excel",
      ".ppt":"application/powerpoint",
      '.docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.docm':'application/vnd.ms-word.document.macroEnabled.12',
      '.dotx':'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
      '.dotm':'application/vnd.ms-word.template.macroEnabled.12',
      '.xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.xlsm':'application/vnd.ms-excel.sheet.macroEnabled.12',
      '.xltx':'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
      '.xltm':'application/vnd.ms-excel.template.macroEnabled.12',
      '.xlsb':'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
      '.xlam':'application/vnd.ms-excel.addin.macroEnabled.12',
      '.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.pptm':'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
      '.potx':'application/vnd.openxmlformats-officedocument.presentationml.template',
      '.potm':'application/vnd.ms-powerpoint.template.macroEnabled.12',
      '.ppsx':'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
      '.ppsm':'application/vnd.ms-powerpoint.slideshow.macroEnabled.12',
      '.ppam':'application/vnd.ms-powerpoint.addin.macroEnabled.12',
      ".tonyu":"text/tonyu"
   };
});
define('DataURL',["extend","assert"],function (extend,assert) {
    var A=(typeof Buffer!="undefined") ? Buffer :ArrayBuffer;
    function isBuffer(data) {
        return data instanceof ArrayBuffer ||
        (typeof Buffer!="undefined" && data instanceof Buffer);
    }
    var DataURL=function (data, contentType){
      // data: String/Array/ArrayBuffer
      if (typeof data=="string") {
          this.url=data;
          this.dataURL2bin(data);
      } else if (data && isBuffer(data.buffer)) {
          this.buffer=data.buffer;
          assert.is(contentType,String);
          this.contentType=contentType;
          this.bin2dataURL(this.buffer, this.contentType);
      } else if (isBuffer(data)) {
          this.buffer=data;
          assert.is(contentType,String);
          this.contentType=contentType;
          this.bin2dataURL(this.buffer, this.contentType);
      } else assert.fail("Invalid args: ",arguments);
   };
   extend(DataURL.prototype,{
      bin2dataURL: function (b, contentType) {
          assert(isBuffer(b));
          assert.is(contentType,String);
  	     var head=this.dataHeader(contentType);
	     var base64=Base64_From_ArrayBuffer(b);
	     assert.is(base64,String);
	     return this.url=head+base64;
	  },
	  dataURL2bin: function (dataURL) {
          assert.is(arguments,[String]);
	      var reg=/data:([^;]+);base64,(.*)$/i;
	      var r=reg.exec(dataURL);
	      assert(r, ["malformed dataURL:", dataURL] );
	      this.contentType=r[1];
	      this.buffer=Base64_To_ArrayBuffer(r[2]);
          return assert.is(this.buffer , A);
  	  },
  	  dataHeader: function (ctype) {
	      assert.is(arguments,[String]);
	      return "data:"+ctype+";base64,";
   	  },
   	  toString: function () {return assert.is(this.url,String);}
   });

	function Base64_To_ArrayBuffer(base64){
	    base64=base64.replace(/[\n=]/g,"");
	    var dic = new Object();
	    dic[0x41]= 0; dic[0x42]= 1; dic[0x43]= 2; dic[0x44]= 3; dic[0x45]= 4; dic[0x46]= 5; dic[0x47]= 6; dic[0x48]= 7; dic[0x49]= 8; dic[0x4a]= 9; dic[0x4b]=10; dic[0x4c]=11; dic[0x4d]=12; dic[0x4e]=13; dic[0x4f]=14; dic[0x50]=15;
	    dic[0x51]=16; dic[0x52]=17; dic[0x53]=18; dic[0x54]=19; dic[0x55]=20; dic[0x56]=21; dic[0x57]=22; dic[0x58]=23; dic[0x59]=24; dic[0x5a]=25; dic[0x61]=26; dic[0x62]=27; dic[0x63]=28; dic[0x64]=29; dic[0x65]=30; dic[0x66]=31;
	    dic[0x67]=32; dic[0x68]=33; dic[0x69]=34; dic[0x6a]=35; dic[0x6b]=36; dic[0x6c]=37; dic[0x6d]=38; dic[0x6e]=39; dic[0x6f]=40; dic[0x70]=41; dic[0x71]=42; dic[0x72]=43; dic[0x73]=44; dic[0x74]=45; dic[0x75]=46; dic[0x76]=47;
	    dic[0x77]=48; dic[0x78]=49; dic[0x79]=50; dic[0x7a]=51; dic[0x30]=52; dic[0x31]=53; dic[0x32]=54; dic[0x33]=55; dic[0x34]=56; dic[0x35]=57; dic[0x36]=58; dic[0x37]=59; dic[0x38]=60; dic[0x39]=61; dic[0x2b]=62; dic[0x2f]=63;
	    var num = base64.length;
	    var n = 0;
	    var b = 0;
	    var e;

	    if(!num) return (new A(0));
	    //if(num < 4) return null;
	    //if(num % 4) return null;

	    // AA     12    1
	    // AAA    18    2
	    // AAAA   24    3
	    // AAAAA  30    3
	    // AAAAAA 36    4
	    // num*6/8
	    e = Math.floor(num / 4 * 3);
	    if(base64.charAt(num - 1) == '=') e -= 1;
	    if(base64.charAt(num - 2) == '=') e -= 1;

	    var ary_buffer = new A( e );
	    var ary_u8 = (typeof Buffer!="undefined" ? ary_buffer : new Uint8Array( ary_buffer ));
	    var i = 0;
	    var p = 0;
	    while(p < e){
	        b = dic[base64.charCodeAt(i)];
	        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i));//return null;
	        n = (b << 2);
	        i ++;

	        b = dic[base64.charCodeAt(i)];
	        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i))
            ary_u8[p] = n | ((b >> 4) & 0x3);
	        /*if (p==0) {
	            console.log("WOW!", n | ((b >> 4) & 0x3), ary_u8[p]);
	        }*/
	        n = (b & 0x0f) << 4;
	        i ++;
	        p ++;
	        if(p >= e) break;

	        b = dic[base64.charCodeAt(i)];
	        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i))
	        ary_u8[p] = n | ((b >> 2) & 0xf);
	        n = (b & 0x03) << 6;
	        i ++;
	        p ++;
	        if(p >= e) break;

	        b = dic[base64.charCodeAt(i)];
	        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i))
	        ary_u8[p] = n | b;
	        i ++;
	        p ++;
	    }
	    function fail(m) {
	        console.log(m);
	        console.log(base64,i);
	        throw new Error(m);
	    }
        //console.log("WOW!", ary_buffer[0],ary_u8[0]);
	    return ary_buffer;
	}
	function Base64_From_ArrayBuffer(ary_buffer){
		var dic = [
			'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P',
			'Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f',
			'g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v',
			'w','x','y','z','0','1','2','3','4','5','6','7','8','9','+','/'
		];
		var base64 = "";
		var ary_u8 = new Uint8Array( ary_buffer );
		var num = ary_u8.length;
		var n = 0;
		var b = 0;

		var i = 0;
		while(i < num){
			b = ary_u8[i];
			base64 += dic[(b >> 2)];
			n = (b & 0x03) << 4;
			i ++;
			if(i >= num) break;

			b = ary_u8[i];
			base64 += dic[n | (b >> 4)];
			n = (b & 0x0f) << 2;
			i ++;
			if(i >= num) break;

			b = ary_u8[i];
			base64 += dic[n | (b >> 6)];
			base64 += dic[(b & 0x3f)];
			i ++;
		}

		var m = num % 3;
		if(m){
			base64 += dic[n];
		}
		if(m == 1){
			base64 += "==";
		}else if(m == 2){
			base64 += "=";
		}
		return base64;
	}
    return DataURL;
});
define('Contents',["DataURL"],function (DataURL){
   var Contents={
      convert: function (src, destType, options) {
         // options:{encoding: , contentType: }
         // src: String|DataURL|ArrayBuffer|OutputStream|Writer
         // destType: String|DataURL|ArrayBuffer|InputStream|Reader
         var srcType;
         if (typeof src=="string") srcType=String;
         if (src instanceof DataURL) srcType=DataURL;
         if (src instanceof ArrayBuffer) srcType=ArrayBuffer;
         if (srcType==destType) return src;
         throw new Error("Cannot convert from "+srcType+" to "+destType);
      }
   };
   return Contents;
});
define('SFile',["Contents","extend","assert","PathUtil"],
function (C,extend,A,P) {

var SFile=function (fs, path) {
    A.is(path, P.Absolute);
    A(fs && fs.getReturnTypes);
    this._path=path;
    this.fs=fs;
    if (this.isDir() && !P.isDir(path)) {
        this._path+=P.SEP;
    }
};
SFile.is=function (path) {
    return path && typeof (path.isSFile)=="function" && path.isSFile();
};
function getPath(f) {
    if (SFile.is(f)) {
        return f.path();
    } else {
        A.is(f,P.Absolute);
        return f;
    }
}
SFile.prototype={
    isSFile: function (){return true;},
    _clone: function (){
        return this.fs.getRootFS().get(this.path());
    },
    _resolve: function (path) {
        var res;
        if (SFile.is(path)) {
            res=path;
        } else {
            A.is(path,P.Absolute);
            res=this.fs.getRootFS().get(path);
        }
        if (this.wrapper) {
            return this.wrapper.wrap(res);
        } else {
            return res;
        }
    },
    contains: function (file) {
        A(SFile.is(file),file+" shoud be a SFile object.");
        if (!this.isDir()) return false;
        return P.startsWith( file.path(), this.path());
    },
    // Path from Root
    path: function () {
        return this._path;//this.fs.getPathFromRootFS(this.pathT);
    },
    // Path from This fs
    /*pathInThisFS: function () {
        return this.pathT;
    },*/
    name: function () {
        return P.name(this.path());
    },
    truncExt: function (ext) {
        return P.truncExt(this.path(),ext);
    },
    ext: function () {
        return P.ext(this.path());
    },
    relPath: function (base) {
        // base should be SFile or Path from rootFS
        var bp=(base.path ?
                base.path() :
                base );
        return P.relPath(this.path(), A.is(bp,P.Absolute) );
    },
    up:function () {
        var pathR=this.path();
        var pa=P.up(pathR);
        if (pa==null) return null;
        return this._resolve(pa);
    },
    rel: function (relPath) {
        A.is(relPath, P.Relative);
        this.assertDir();
        var pathR=this.path();
        return this._resolve(P.rel(pathR, relPath));
    },
    startsWith: function (pre) {
        return P.startsWith(this.name(),pre);
    },
    endsWith: function (post) {
        return P.endsWith(this.name(),post);
    },
    equals:function (o) {
        return (o && typeof o.path=="function" && o.path()==this.path());
    },
    toString:function (){
        return this.path();
    },
    //Common
    touch: function () {
        this.fs.touch(this.path());
    },
    isReadOnly: function () {
        this.fs.isReadOnly(this.path());
    },
    isTrashed:function () {
        var m=this.metaInfo();
        if (!m) return false;
        return m.trashed;
    },
    metaInfo: function () {
        if (arguments.length==0) {
            return this.getMetaInfo.apply(this,arguments);
        } else {
            return this.setMetaInfo.apply(this,arguments);
        }
    },
    getMetaInfo: function (options) {
        return this.fs.getMetaInfo(this.path(),options);
    },
    setMetaInfo: function (info, options) {
        return this.fs.setMetaInfo(this.path(),info, options);
    },
    lastUpdate:function () {
        A(this.exists());
        return this.metaInfo().lastUpdate;
    },
    /*rootFS: function () {
        return this.fs.getRootFS();
    },*/
    exists: function (options) {
        options=options||{};
        var p=this.fs.exists(this.path(),options);
        if (p || options.noFollowLink) {
            return p;
        } else {
            return this.resolveLink().exists({noFollowLink:true});
        }
    },
    /*copyTo: function (dst, options) {
        this.fs.cp(this.path(),getPath(dst),options);
    },*/
    rm: function (options) {
        options=options||{};
        if (!this.exists({noFollowLink:true})) {
            var l=this.resolveLink();
            if (!this.equals(l)) return l.rm(options);
        }
        if (this.isDir() && (options.recursive||options.r)) {
            this.each(function (f) {
                f.rm(options);
            });
        }
        var pathT=this.path();
        this.fs.rm(pathT, options);
    },
    removeWithoutTrash: function (options) {
        options=options||{};
        options.noTrash=true;
        this.rm(options);
    },
    isDir: function () {
        return this.fs.isDir(this.path());
    },
    // File
    text:function () {
        var l=this.resolveLink();
        if (!this.equals(l)) return l.text.apply(l,arguments);
        if (arguments.length>0) {
            this.setText(arguments[0]);
        } else {
            return this.getText();
        }
    },
    setText:function (t) {
        A.is(t,String);
        this.fs.setContent(this.path(), t);
    },
    getText:function (t) {
        return this.fs.getContent(this.path(), {type:String});
    },
    lines:function () {
        return this.text().split("\n");
    },
    obj: function () {
        var file=this;
        if (arguments.length==0) {
            var t=file.text();
            if (!t) return null;
            return JSON.parse(t);
        } else {
            file.text(JSON.stringify(A.is(arguments[0],Object) ));
        }
    },
    copyFrom: function (src, options) {
        var dst=this;
        var options=options||{};
        var srcIsDir=src.isDir();
        var dstIsDir=dst.isDir();
        if (!srcIsDir && dstIsDir) {
            dst=dst.rel(src.name());
            assert(!dst.isDir(), dst+" exists as an directory.");
            dstIsDir=false;
        }
        if (srcIsDir && !dstIsDir) {
           this.err("Cannot move dir to file");
        } else if (!srcIsDir && !dstIsDir) {
            //this.fs.cp(A.is(src.path(), P.Absolute), this.path(),options);
            var srcc=src.getText(); // TODO
            var res=dst.setText(srcc);
            if (options.a) {
                dst.setMetaInfo(src.getMetaInfo());
            }
            return res;
        } else {
            A(srcIsDir && dstIsDir);
            var t=this;
            src.each(function (s) {
                dst.rel(s.name()).copyFrom(s, options);
            });
        }
        //file.text(src.text());
        //if (options.a) file.metaInfo(src.metaInfo());
    },
    moveFrom: function (src, options) {
        var res=this.copyFrom(src,options);
        src.rm({recursive:true});
        return res;//this.fs.mv(getPath(src),this.path(),options);
    },
    // Dir
    assertDir:function () {
        A.is(this.path(),P.Dir);
        return this;
    },
    /*files:function (f,options) {
        var dir=this.assertDir();
        var res=[];
        this.each(function (f) {
            res.add(f);
        },options);
        return res;
    },*/
    each:function (f,options) {
        var dir=this.assertDir();
        dir.listFiles(options).forEach(f);
    },
    recursive:function (fun,options) {
        var dir=this.assertDir();
        dir.each(function (f) {
            if (f.isDir()) f.recursive(fun);
            else fun(f);
        },options);
    },
    listFiles:function (options) {
        A(options==null || typeof options=="object");
        var dir=this.assertDir();
        var l=this.resolveLink();
        if (!this.equals(l)) return l.listFiles.apply(l,arguments);
        var path=this.path();
        var ord;
        if (typeof options=="function") ord=options;
        options=dir.convertOptions(options);
        if (!ord) ord=options.order;
        var di=this.fs.opendir(path, options);
        var res=[];
        for (var i=0;i<di.length; i++) {
            var name=di[i];
            //if (!options.includeTrashed && dinfo[i].trashed) continue;
            if (options.excludes[path+name] ) continue;
            res.push(dir.rel(name));
        }
        if (typeof ord=="function" && res.sort) res.sort(ord);
        return res;
    },
    ls:function (options) {
        A(options==null || typeof options=="object");
        var dir=this.assertDir();
        var res=dir.listFiles(options);
        return res.map(function (f) {
            return f.name();
        });
    },
    convertOptions:function(options) {
        var dir=this.assertDir();
        var pathR=this.path();
        if (!options) options={};
        if (!options.excludes) options.excludes={};
        if (options.excludes instanceof Array) {
            var excludes={};
            options.excludes.forEach(function (e) {
                if (P.startsWith(e,"/")) {
                    excludes[e]=1;
                } else {
                    excludes[pathR+e]=1;
                }
            });
            options.excludes=excludes;
        }
        return A.is(options,{excludes:{}});
    },
    mkdir: function () {
        this.touch();
    },
    link: function (to,options) {// % ln to path
        to=this._resolve(A(to));
        this.fs.link(this.path(),to.path(),options);
    },
    resolveLink: function () {
        var l=this.fs.resolveLink(this.path());
        A.is(l,P.Absolute);
        return this._resolve(l);
    },
    isLink: function () {
        return this.fs.isLink(this.path());
    }
};
return SFile;
});

define('FS2',["extend","PathUtil","MIMETypes","assert","SFile"],function (extend, P, M,assert,SFile){
    var FS=function () {
    };
    function stub(n) {
        throw new Error (n+" is STUB!");
    }
    extend(FS.prototype, {
        err: function (path, mesg) {
            throw new Error(path+": "+mesg);
        },
        // mounting
        fstab: function () {
            return this._fstab=this._fstab||[{fs:this, path:P.SEP}];
        },
        resolveFS:function (path, options) {
            assert.is(path,P.Absolute);
            var res;
            this.fstab().forEach(function (tb) {
                if (res) return;
                if (P.startsWith(path, tb.path)) {
                    res=tb.fs;
                }
            });
            if (!res) this.err(path,"Cannot resolve");
            return assert.is(res,FS);
        },
        isReadOnly: function (path, options) {// mainly for check ENTIRELY read only
            stub("isReadOnly");
        },
        mounted: function (parentFS, mountPoint ) {
            assert.is(arguments,[FS,P.AbsDir]);
            this.parentFS=parentFS;
            this.mountPoint=mountPoint;
        },
        relFromMountPoint: function (path) {
            assert.is(path, P.Absolute);
            if (this.parentFS) {
                assert.is(this.mountPoint, P.AbsDir);
                return P.relPath(path, this.mountPoint);
            } else {
                return P.relPath(path, P.SEP);
            }
        },
        dirFromFstab: function (path, options) {
            assert.is(path, P.AbsDir);
            var res=(options||{}).res || [];
            this.fstab().forEach(function (tb) {
                if (P.up( tb.path )==path) res.push(P.name(tb.path));
            });
            return res;
        },
        getRootFS: function () {
            var res;
            for (var r=this;r;r=r.parentFS){res=r;}
            return assert.is(res,FS);
        },
        //-------- end of mouting
        //-------- spec
        getReturnTypes: function (path, options) {
            //{getContent:String|DataURL|ArrayBuffer|OutputStream|Writer
            //   ,opendir:Array|...}
            stub("");
        },
        //-------  for file
        getContent: function (path, options) {
            // options:{type:String|DataURL|ArrayBuffer|OutputStream|Writer}
            // succ : [type],
            stub("");
        },
        setContent: function (path, content, options) {
            // content: String|ArrayBuffer|InputStream|Reader
            stub("");
        },
        getMetaInfo: function (path, options) {
            stub("");
        },
        setMetaInfo: function (path, info, options) {
            stub("");
        },
        mkdir: function (path, options) {
            stub("mkdir");
        },
        touch: function (path) {
            stub("touch");
        },
        exists: function (path, options) {
            // exists return false if path is existent by follwing symlink
            stub("exists");
        },
        opendir: function (path, options) {
            //ret: [String] || Stream<string> // https://nodejs.org/api/stream.html#stream_class_stream_readable
            stub("opendir");
        },
        cp: function(path, dst, options) {
            assert.is(arguments,[P.Absolute,P.Absolute]);
            options=options||{};
            var srcIsDir=this.isDir(path);
            var dstIsDir=this.resolveFS(dst).isDir(dst);
            if (!srcIsDir && !dstIsDir) {
                var src=this.getContent(path,{type:String}); // TODO
                var res=this.resolveFS(dst).setContent(dst,src);
                if (options.a) {
                    //console.log("-a", this.getMetaInfo(path));
                    this.setMetaInfo(dst, this.getMetaInfo(path));
                }
                return res;
            } else {
                throw "only file to file supports";
            }
        },
        mv: function (path,to,options) {
            this.cp(path,to,options);
            return this.rm(path,{r:true});
        },
        rm:function (path, options) {
            stub("");
        },
        link: function (path, to, options) {
            throw new Error("This FS not support link.");
        },
        getURL: function (path) {
            stub("");
        }
    });
    //res=[]; for (var k in a) { res.push(k); } res;
    FS.delegateMethods=function (prototype,  methods) {
        for (var n in methods) {
            (function (n){
                prototype[n]=function () {
                    var path=arguments[0];
                    assert.is(path,P.Absolute);
                    var fs=this.resolveFS(path);
                    //console.log(n, f.fs===this  ,f.fs, this);
                    if (fs!==this) {
                        //arguments[0]=f.path;
                        return fs[n].apply(fs, arguments);
                    } else {
                        return methods[n].apply(this, arguments);
                    }
                };
            })(n);
        }
    };
    FS.delegateMethods(FS.prototype, {
        assertWriteable: function (path) {
            if (this.isReadOnly(path)) this.err(path, "read only.");
        },
        mount: function (path, fs, options) {
            assert.is(arguments,[P.AbsDir, FS] );
            if (this.exists(path)) {
                throw new Error(path+": Directory exists");
            }
            var parent=P.up(path);
            if (parent==null) throw new Error("Cannot mount on root");
            if (!this.exists(parent)) {
                throw new Error(path+": Parent Directory not exist");
            }
            fs.mounted(this, path);
            this.fstab().unshift({path:path, fs:fs});
        },
        getContentType: function (path, options) {
            var e=P.ext(path);
            return M[e] || (options||{}).def || "application/octet-stream";
        },
        isText:function (path) {
            var m=this.getContentType(path);
            return P.startsWith( m, "text");
        },
        assertExist: function (path, options) {
            if (!this.exists(path, options)) {
                this.err(path, ": No such "+(P.isDir(path)?"directory":"file"));
            }
        },
        isDir: function (path,options) {
            return P.isDir(path);
        },
        find: function (path, options) {
            assert.is(arguments,[P.Absolute]);
            var ls=this.opendir(path, options);
            var t=this;
            var res=[path];
            ls.forEach(function (e) {
                var ep=P.rel(path, e);
                if (P.isDir(ep)) {
                    var fs=t.resolveFS(ep);
                    res=res.concat(
                            fs.find( ep ,options)
                    );
                } else {
                    res.push( ep );//getPathFromRootFS
                }
            });
            return res;
        },
        resolveLink: function (path) {
            assert.is(path,P.Absolute);
            // returns non-link path
            // ln -s /a/b/ /c/d/
            // resolveLink /a/b/    ->  /a/b/
            // resolveLink /c/d/e/f -> /a/b/e/f
            // resolveLink /c/d/non_existent -> /a/b/non_existent
            // isLink      /c/d/    -> /a/b/
            // isLink      /c/d/e/f -> null
            // ln /testdir/ /ram/files/
            // resolveLink /ram/files/sub/test2.txt -> /testdir/sub/test2.txt
            if (this.exists(path)) return path;
            // path=/ram/files/test.txt
            for (var p=path ; p ; p=P.up(p)) {
                assert(!this.mountPoint || P.startsWith(p, this.mountPoint), p+" is out of mountPoint. path="+path);
                var l=this.isLink(p);  // p=/ram/files/ l=/testdir/
                if (l) {
                    //        /testdir/    test.txt
                    var np=P.rel(l,P.relPath(path, p));  //   /testdir/test.txt
                    return assert.is(this.resolveFS(np).resolveLink(np),P.Absolute)  ;
                }
                if (this.exists(p)) return path;
            }
            return path;
        },
        isLink: function (path) {
            return null;
        },
        get: function (path) {
            assert.eq(this.resolveFS(path), this);
            return new SFile(this, path);
            //var r=this.resolveFS(path);
            //return new SFile(r.fs, r.path);
        }
    });
    return FS;
});

define('WebSite',[], function () {
    var loc=document.location.href;
    var WS=window.WebSite={};
    // from https://w3g.jp/blog/js_browser_sniffing2015
    var u=window.navigator.userAgent.toLowerCase();
    WS.tablet=(u.indexOf("windows") != -1 && u.indexOf("touch") != -1)
    || u.indexOf("ipad") != -1
    || (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
    || (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
    || u.indexOf("kindle") != -1
    || u.indexOf("silk") != -1
    || u.indexOf("playbook") != -1;
    WS.mobile=(u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
    || u.indexOf("iphone") != -1
    || u.indexOf("ipod") != -1
    || (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
    || (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
    || u.indexOf("blackberry") != -1;
    //-------------
    WS.top=".";
    if (!WS.pluginTop) {
        WS.pluginTop=WS.top+"/js/plugins";
    }
    WS.disableROM={};
    if (loc.match(/\.appspot\.com/) ||  loc.match(/localhost:888[87]/)) {
        WS.serverType="GAE";
    }
    WS.sampleImg=WS.top+"/images";
    WS.isNW=(typeof process=="object" && process.__node_webkit);
    //WS.fsHome="";
    WS.tonyuHome="/Tonyu/";
    WS.JSLKer="fs/Tonyu/Projects/JSLKer";
    WS.serverTop=".";
    WS.phpTop=WS.serverTop+"/php/";
    WS.url={
            getDirInfo:WS.phpTop+"getDirInfo.php",
            getFiles:WS.phpTop+"getFiles.php",
            putFiles:WS.phpTop+"putFiles.php"
    };
    /*if (WS.isNW) {
        if (process.env.TONYU_HOME) {
            WS.tonyuHome=process.env.TONYU_HOME.replace(/\\/g,"/");
        } else {
            WS.tonyuHome=process.cwd().replace(/\\/g,"/").replace(/\/$/,"")+"/fs/Tonyu/";
        }
    }*///DELJSL
    WS.tonyuKernel=WS.tonyuHome+"Kernel/";
    return WS;
});

define('NativeFS',["FS2","assert","PathUtil","extend","MIMETypes","DataURL"],
        function (FS,A,P,extend,MIME,DataURL) {
    var available=(typeof process=="object" && process.__node_webkit);
    if (!available) {
        return function () {
            throw new Error("This system not suppert native FS");
        };
    }
    var assert=A;
    var fs=require("fs");
    var NativeFS=function (rootPoint) {
        if (rootPoint) {
            A.is(rootPoint, P.AbsDir);
            this.rootPoint=rootPoint;
        }
    };
    NativeFS.available=true;
    var SEP=P.SEP;
    var json=JSON; // JSON changes when page changes, if this is node module, JSON is original JSON
    var Pro=NativeFS.prototype=new FS;
    Pro.toNativePath = function (path) {
        if (!this.rootPoint) return path;
        A.is(path, P.Absolute);
        return P.rel( this.rootPoint, this.relFromMountPoint(path));
    };
    /*Pro.isText=function (path) {
        var e=P.ext(path);
        var m=MIME[e];
        return P.startsWith( m, "text");
    };*/
    FS.delegateMethods(NativeFS.prototype, {
        getReturnTypes: function(path, options) {
            assert.is(arguments,[String]);
            return {
                getContent: ArrayBuffer, opendir:[String]
            };
        },
        getContent: function (path, options) {
            options=options||{};
            A.is(path,P.Absolute);
            var np=this.toNativePath(path);
            var t=options.type;
            if (this.isText(path)) {
                if (t===String) {
                    return fs.readFileSync(np, {encoding:"utf8"});
                } else {
                    //TODOvar bin=fs.readFileSync(np);
                    throw new Error("TODO: handling bin file "+path);
                }
            } else {
                if (t===String) {
                    var bin=fs.readFileSync(np);
                    var d=new DataURL(bin, this.getContentType(path) );
                    return d.url;
                } else {
                    return fs.readFileSync(np);
                }
            }
        },
        setContent: function (path,content) {
            A.is(path,P.Absolute);
            var pa=P.up(path);
            if (pa) this.getRootFS().mkdir(pa);
            var np=this.toNativePath(path);
            var cs=typeof content=="string";
            if (this.isText(path)) {
                if (cs) return fs.writeFileSync(np, content);
                else {
                    throw new Error("TODO");
                }
            } else {
//                console.log("NatFS", cs, content);
                if (!cs) return fs.writeFileSync(np, content);
                else {
                    var d=new DataURL(content);
                    //console.log(d.buffer);
                    return fs.writeFileSync(np, d.buffer);
                }
            }
        },
        getMetaInfo: function(path, options) {
            this.assertExist(path, options);
            var s=this.stat(path);
            s.lastUpdate=s.mtime.getTime();
            return s;
        },
        setMetaInfo: function(path, info, options) {

            //options.lastUpdate

            //TODO:
        },
        isReadOnly: function (path) {
            // TODO:
            return false;
        },
        stat: function (path) {
            A.is(path,P.Absolute);
            var np=this.toNativePath(path);
            return fs.statSync(np);
        },
        mkdir: function(path, options) {
            assert.is(arguments,[P.Absolute]);
            if (this.exists(path)){
                if (this.isDir(path)) {
                    return;
                } else {
                    throw new Error(this+" is a file. not a dir.");
                }
            }
            this.assertWriteable(path);
            var pa=P.up(path);
            if (pa) this.getRootFS().mkdir(pa);
            var np=this.toNativePath(path);
            return fs.mkdirSync(np);
        },
        opendir: function (path, options) {
            assert.is(arguments,[String]);
            var np=this.toNativePath(path);
            var ts=P.truncSEP(np);
            var r=fs.readdirSync(np).map(function (e) {
                var s=fs.statSync(ts+SEP+e);
                var ss=s.isDirectory()?SEP:"";
                return e+ss;
            });
            var res=this.dirFromFstab(path);
            return assert.is(res.concat(r),Array);
        },
        rm: function(path, options) {
            assert.is(arguments,[P.Absolute]);
            options=options||{};
            this.assertExist(path);
            var np=this.toNativePath(path);
            if (this.isDir(path)) {
                return fs.rmdirSync(np);
            } else {
                return fs.unlinkSync(np);
            }
        },
        exists: function (path, options) {
            var np=this.toNativePath(path);
            return fs.existsSync(np);
        },
        isDir: function (path) {
            if (!this.exists(path)) {
                return P.isDir(path);
            }
            return this.stat(path).isDirectory();
        },
        /*link: function(path, to, options) {
        }//TODO
        isLink:
        */
        touch: function (path) {
            if (!this.exists(path) && this.isDir(path)) {
                this.mkdir(path);
            } else if (this.exists(path) && !this.isDir(path) ) {
                // TODO(setlastupdate)
            }
        }
    });
    return NativeFS;
});
define('LSFS',["FS2","PathUtil","extend","assert"], function(FS,P,extend,assert) {
    var LSFS = function(storage,options) {
    	this.storage=storage;
    	this.options=options||{};
    };
    var isDir = P.isDir.bind(P);
    var up = P.up.bind(P);
    var endsWith= P.endsWith.bind(P);
    //var getName = P.name.bind(P);
    var Path=P.Path;
    var Absolute=P.Absolute;
    var SEP= P.SEP;
    function now(){
        return new Date().getTime();
    }
    LSFS.ramDisk=function () {
        var s={};
        s[P.SEP]="{}";
        return new LSFS(s);
    };
    LSFS.now=now;
    LSFS.prototype=new FS;
    //private methods
    LSFS.prototype.resolveKey=function (path) {
        assert.is(path,P.Absolute);
        return P.SEP+this.relFromMountPoint(path);
    };
    LSFS.prototype.getItem=function (path) {
        assert.is(path,P.Absolute);
        var key=this.resolveKey(path);
        return this.storage[key];
    };
    LSFS.prototype.setItem=function (path, value) {
        assert.is(path,P.Absolute);
        var key=this.resolveKey(path);
        /*if (key.indexOf("..")>=0) {
            console.log(path,key,value);
        }*/
        assert(key.indexOf("..")<0);
        assert(P.startsWith(key,P.SEP));
        this.storage[key]=value;
    };
    LSFS.prototype.removeItem=function (path) {
        assert.is(path,P.Absolute);
        var key=this.resolveKey(path);
        delete this.storage[key];
    };
    LSFS.prototype.itemExists=function (path) {
        assert.is(path,P.Absolute);
        var key=this.resolveKey(path);
        return key in this.storage;
    };
    LSFS.prototype.inMyFS=function (path){
        return !this.mountPoint || P.startsWith(path, this.mountPoint);
    };
    LSFS.prototype.getDirInfo=function getDirInfo(path) {
        assert.is(arguments,[P.AbsDir]);
        if (path == null) throw new Error("getDir: Null path");
        if (!endsWith(path, SEP)) path += SEP;
        assert(this.inMyFS(path));
        var dinfo = {};
        try {
            var dinfos = this.getItem(path);
            if (dinfos) {
                dinfo = JSON.parse(dinfos);
            }
        } catch (e) {
            console.log("dinfo err : " , path , dinfos);
        }
        return dinfo;
    };
    LSFS.prototype.putDirInfo=function putDirInfo(path, dinfo, trashed) {
  	    assert.is(arguments,[P.AbsDir, Object]);
  	    if (!isDir(path)) throw new Error("Not a directory : " + path);
  	    assert(this.inMyFS(path));
  	    this.setItem(path, JSON.stringify(dinfo));
        var ppath = up(path);
        if (ppath == null) return;
        if (!this.inMyFS(ppath)) {
            assert(this.getRootFS()!==this);
            this.getRootFS().touch(ppath);
            return;
        }
        var pdinfo = this.getDirInfo(ppath);
        this._touch(pdinfo, ppath, P.name(path), trashed);
    };
    LSFS.prototype._touch=function _touch(dinfo, path, name, trashed) {
        // path:path of dinfo
        // trashed: this touch is caused by trashing the file/dir.
        assert.is(arguments,[Object, String, String]);
        assert(this.inMyFS(path));
        if (!dinfo[name]) {
            dinfo[name] = {};
            if (trashed) dinfo[name].trashed = true;
        }
        if (!trashed) delete dinfo[name].trashed;
        dinfo[name].lastUpdate = now();
        this.putDirInfo(path, dinfo, trashed);
    };
    LSFS.prototype.removeEntry=function removeEntry(dinfo, path, name) { // path:path of dinfo
        assert.is(arguments,[Object, String, String]);
        if (dinfo[name]) {
            dinfo[name] = {
                lastUpdate: now(),
                trashed: true
            };
            this.putDirInfo(path, dinfo, true);
        }
    };
    LSFS.prototype.removeEntryWithoutTrash=function (dinfo, path, name) { // path:path of dinfo
        assert.is(arguments,[Object, String, String]);
        if (dinfo[name]) {
            delete dinfo[name];
            this.putDirInfo(path, dinfo, true);
        }
    };
    // public methods (with resolve fs)
    FS.delegateMethods(LSFS.prototype, {
        isReadOnly: function () {return this.options.readOnly;},
        getReturnTypes: function(path, options) {
            assert.is(arguments,[String]);
            return {
                getContent: String, opendir:[String]
            };
        },
        getContent: function(path, options) {
            assert.is(arguments,[Absolute]);
            this.assertExist(path);
            return this.getItem(path);
        },
        setContent: function(path, content, options) {
            assert.is(arguments,[Absolute,String]);
            this.assertWriteable(path);
            this.setItem(path, content);
            this.touch(path);
        },
        getMetaInfo: function(path, options) {
            this.assertExist(path, {includeTrashed:true});
            assert.is(arguments,[Absolute]);
            if (path==P.SEP) {
                return {};
            }
            var parent=assert(P.up(path));
            if (!this.inMyFS(parent)) {
                return {};
            }
            var name=P.name(path);
            assert.is(parent,P.AbsDir);
            var pinfo=this.getDirInfo(parent);
            return assert(pinfo[name]);
        },
        setMetaInfo: function(path, info, options) {
            assert.is(arguments,[String,Object]);
            this.assertWriteable(path);
            var parent=assert(P.up(path));
            if (!this.inMyFS(parent)) {
                return;
            }
            var pinfo=this.getDirInfo(parent);
            var name=P.name(path);
            pinfo[name]=info;
            this.putDirInfo(parent, pinfo, pinfo[name].trashed);
        },
        mkdir: function(path, options) {
            assert.is(arguments,[Absolute]);
            this.assertWriteable(path);
			this.touch(path);
        },
        opendir: function(path, options) {
            assert.is(arguments,[String]);
            //succ: iterator<string> // next()
            // options: {includeTrashed:Boolean}
            options=options||{};
            var inf=this.getDirInfo(path);
            var res=this.dirFromFstab(path);
            for (var i in inf) {
                assert(inf[i]);
                if (!inf[i].trashed || options.includeTrashed) res.push(i);
            }
            return assert.is(res,Array);
        },
        rm: function(path, options) {
            assert.is(arguments,[Absolute]);
            options=options||{};
            this.assertWriteable(path);
            var parent=P.up(path);
            if (parent==null || !this.inMyFS(parent)) {
                throw new Error(path+": cannot remove. It is root of this FS.");
            }
            this.assertExist(path,{includeTrashed:options.noTrash });
            if (P.isDir(path)) {
                var lis=this.opendir(path);
                if (lis.length>0) {
                    this.err(path,"Directory not empty");
                }
                if (options.noTrash) {
                    this.removeItem(path);
                }
            } else {
                this.removeItem(path);
            }
            var pinfo=this.getDirInfo(parent);
            if (options.noTrash) {
                this.removeEntryWithoutTrash(pinfo, parent, P.name(path) );
            } else {
                this.removeEntry(pinfo, parent, P.name(path) );
            }
        },
        exists: function (path,options) {
            assert.is(arguments,[Absolute]);
            options=options||{};
            var name=P.name(path);
            var parent=P.up(path);
            if (parent==null || !this.inMyFS(parent)) return true;
            var pinfo=this.getDirInfo(parent);
            var res=pinfo[name];
            if (res && res.trashed && this.itemExists(path)) {
                if (this.isDir(path)) {

                } else {
                    assert.fail("Inconsistent "+path+": trashed, but remains in storage");
                }
            }
            if (!res && this.itemExists(path)) {
                assert.fail("Inconsistent "+path+": not exists in metadata, but remains in storage");
            }
            if (res && !res.trashed && !res.link && !this.itemExists(path)) {
                assert.fail("Inconsistent "+path+": exists in metadata, but not in storage");
            }
            if (res && !options.includeTrashed) {
                res=!res.trashed;
            }
            return !!res;
        },
        link: function(path, to, options) {
            assert.is(arguments,[P.AbsDir,P.AbsDir]);
            this.assertWriteable(path);
            if (this.exists(path)) this.err(path,"file exists");
            if (P.isDir(path) && !P.isDir(to)) {
                this.err(path," can not link to file "+to);
            }
            if (!P.isDir(path) && P.isDir(to)) {
                this.err(path," can not link to directory "+to);
            }
            var m={};//assert(this.getMetaInfo(path));
            m.link=to;
            m.lastUpdate=now();
            this.setMetaInfo(path, m);
            //console.log(this.getMetaInfo(path));
            console.log(this.storage);
            //console.log(this.getMetaInfo(P.up(path)));
            assert(this.exists(path));
            assert(this.isLink(path));
        },
        isLink: function (path) {
            assert.is(arguments,[P.AbsDir]);
            if (!this.exists(path)) return null;
            var m=assert(this.getMetaInfo(path));
            return m.link;
        },
        touch: function (path) {
            assert.is(arguments,[Absolute]);
            this.assertWriteable(path);
            if (!this.itemExists(path)) {
                if (P.isDir(path)) {
                    this.setItem(path,"{}");
                } else {
                    this.setItem(path,"");
                }
            }
            var parent=up(path);
            if (parent!=null) {
                if (this.inMyFS(parent)) {
                    var pinfo=this.getDirInfo(parent);
                    this._touch(pinfo, parent , P.name(path), false);
                } else {
                    assert(this.getRootFS()!==this);
                    this.getRootFS().touch(parent);
                }
            }
        }
    });
    return LSFS;

});
define('Env',["assert","PathUtil"],function (A,P) {
    var Env=function (value) {
        this.value=value;
    };
    Env.prototype={
            expand:function (str) {
                A.is(str,String);
                var t=this;
                return str.replace(/\$\{([a-zA-Z0-9_]+)\}/g, function (a,key) {
                    return t.get(key);
                });
            },
            expandPath:function (path) {
                A.is(path,String);
                path=this.expand(path);
                path=path.replace(/\/+/g,"/");
                return A.is(path,P.Path);
            },
            get: function (key) {
                return this.value[key];
            },
            set: function (key, value) {
                this.value[key]=value;
            }
    };
    return Env;
});
define('FS',["FS2","WebSite","NativeFS","LSFS", "PathUtil","Env","assert","SFile"],
        function (FS,WebSite,NativeFS,LSFS, P,Env,A,SFile) {
    var FS={};
    var rootFS;
    var env=new Env(WebSite);
    if (WebSite.isNW) {
        var nfsp=process.env.TONYU_FS_HOME || P.rel(process.cwd().replace(/\\/g,"/"), "www/fs/");
        console.log("nfsp",nfsp);
        rootFS=new NativeFS(nfsp);
    } else {
        rootFS=new LSFS(localStorage);
    }
    FS.get=function () {
        return rootFS.get.apply(rootFS,arguments);
    };
    FS.expandPath=function () {
        return env.expandPath.apply(env,arguments);
    };
    FS.resolve=function (path, base) {
        if (SFile.is(path)) return path;
        path=env.expandPath(path);
        if (base && !P.isAbsolutePath(path)) {
            base=env.expandPath(base);
            return FS.get(base).rel(path);
        }
        return FS.get(path);
    };
    return FS;
});
Util=(function () {

function getQueryString(key, default_)
{
   if (default_==null) default_="";
   key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
   var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
   var qs = regex.exec(window.location.href);
   if(qs == null)
    return default_;
   else
    return decodeURLComponentEx(qs[1]);
}
function decodeURLComponentEx(s){
    return decodeURIComponent(s.replace(/\+/g, '%20'));
}
function endsWith(str,postfix) {
    return str.substring(str.length-postfix.length)===postfix;
}
function startsWith(str,prefix) {
    return str.substring(0, prefix.length)===prefix;
}
// From http://hakuhin.jp/js/base64.html#BASE64_DECODE_ARRAY_BUFFER
function Base64_To_ArrayBuffer(base64){
    base64=base64.replace(/[\n=]/g,"");
    var dic = new Object();
    dic[0x41]= 0; dic[0x42]= 1; dic[0x43]= 2; dic[0x44]= 3; dic[0x45]= 4; dic[0x46]= 5; dic[0x47]= 6; dic[0x48]= 7; dic[0x49]= 8; dic[0x4a]= 9; dic[0x4b]=10; dic[0x4c]=11; dic[0x4d]=12; dic[0x4e]=13; dic[0x4f]=14; dic[0x50]=15;
    dic[0x51]=16; dic[0x52]=17; dic[0x53]=18; dic[0x54]=19; dic[0x55]=20; dic[0x56]=21; dic[0x57]=22; dic[0x58]=23; dic[0x59]=24; dic[0x5a]=25; dic[0x61]=26; dic[0x62]=27; dic[0x63]=28; dic[0x64]=29; dic[0x65]=30; dic[0x66]=31;
    dic[0x67]=32; dic[0x68]=33; dic[0x69]=34; dic[0x6a]=35; dic[0x6b]=36; dic[0x6c]=37; dic[0x6d]=38; dic[0x6e]=39; dic[0x6f]=40; dic[0x70]=41; dic[0x71]=42; dic[0x72]=43; dic[0x73]=44; dic[0x74]=45; dic[0x75]=46; dic[0x76]=47;
    dic[0x77]=48; dic[0x78]=49; dic[0x79]=50; dic[0x7a]=51; dic[0x30]=52; dic[0x31]=53; dic[0x32]=54; dic[0x33]=55; dic[0x34]=56; dic[0x35]=57; dic[0x36]=58; dic[0x37]=59; dic[0x38]=60; dic[0x39]=61; dic[0x2b]=62; dic[0x2f]=63;
    var num = base64.length;
    var n = 0;
    var b = 0;
    var e;

    if(!num) return (new ArrayBuffer(0));
    //if(num < 4) return null;
    //if(num % 4) return null;

    // AA     12    1
    // AAA    18    2
    // AAAA   24    3
    // AAAAA  30    3
    // AAAAAA 36    4
    // num*6/8
    e = Math.floor(num / 4 * 3);
    if(base64.charAt(num - 1) == '=') e -= 1;
    if(base64.charAt(num - 2) == '=') e -= 1;

    var ary_buffer = new ArrayBuffer( e );
    var ary_u8 = new Uint8Array( ary_buffer );
    var i = 0;
    var p = 0;
    while(p < e){
        b = dic[base64.charCodeAt(i)];
        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i));//return null;
        n = (b << 2);
        i ++;

        b = dic[base64.charCodeAt(i)];
        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i))
        ary_u8[p] = n | ((b >> 4) & 0x3);
        n = (b & 0x0f) << 4;
        i ++;
        p ++;
        if(p >= e) break;

        b = dic[base64.charCodeAt(i)];
        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i))
        ary_u8[p] = n | ((b >> 2) & 0xf);
        n = (b & 0x03) << 6;
        i ++;
        p ++;
        if(p >= e) break;

        b = dic[base64.charCodeAt(i)];
        if(b === undefined) fail("Invalid letter: "+base64.charCodeAt(i))
        ary_u8[p] = n | b;
        i ++;
        p ++;
    }
    function fail(m) {
        console.log(m);
        console.log(base64,i);
        throw new Error(m);
    }
    return ary_buffer;
}

function Base64_From_ArrayBuffer(ary_buffer){
    var dic = [
        'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P',
        'Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f',
        'g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v',
        'w','x','y','z','0','1','2','3','4','5','6','7','8','9','+','/'
    ];
    var base64 = "";
    var ary_u8 = new Uint8Array( ary_buffer );
    var num = ary_u8.length;
    var n = 0;
    var b = 0;

    var i = 0;
    while(i < num){
        b = ary_u8[i];
        base64 += dic[(b >> 2)];
        n = (b & 0x03) << 4;
        i ++;
        if(i >= num) break;

        b = ary_u8[i];
        base64 += dic[n | (b >> 4)];
        n = (b & 0x0f) << 2;
        i ++;
        if(i >= num) break;

        b = ary_u8[i];
        base64 += dic[n | (b >> 6)];
        base64 += dic[(b & 0x3f)];
        i ++;
    }

    var m = num % 3;
    if(m){
        base64 += dic[n];
    }
    if(m == 1){
        base64 += "==";
    }else if(m == 2){
        base64 += "=";
    }
    return base64;
}



return {
    getQueryString:getQueryString,
    endsWith: endsWith, startsWith: startsWith,
    Base64_To_ArrayBuffer:Base64_To_ArrayBuffer,
    Base64_From_ArrayBuffer:Base64_From_ArrayBuffer
};
})();

define("Util", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Util;
    };
}(this)));

define('Shell',["FS","Util","WebSite"],function (FS,Util,WebSite) {
    var Shell={cwd:FS.get("/")};
    Shell.cd=function (dir) {
        Shell.cwd=resolve(dir,true);
        return Shell.pwd();
    };
    function resolve(v, mustExist) {
        var r=resolve2(v);
        if (mustExist && !r.exists()) throw r+": no such file or directory";
        return r;
    }
    Shell.resolve=resolve;
    function resolve2(v) {
        if (typeof v!="string") return v;
        if (Util.startsWith(v,"/")) return FS.get(v);
        var c=Shell.cwd;
        /*while (Util.startsWith(v,"../")) {
            c=c.up();
            v=v.substring(3);
        }*/
        return c.rel(v);
    }
    Shell.pwd=function () {
        return Shell.cwd+"";
    };
    Shell.ls=function (dir){
    	if (!dir) dir=Shell.cwd;
    	else dir=resolve(dir, true);
        return dir.ls();
    };
    Shell.mv=function (from ,to ,options) {
        var f=resolve(from, true);
        var t=resolve(to);
        t.moveFrom(f);
    };
    Shell.cp=function (from ,to ,options) {
        if (!options) options={};
        if (options.v) {
            Shell.echo("cp", from ,to);
        }
        var f=resolve(from, true);
        var t=resolve(to);
        return t.copyFrom(f,options);
        /*
        if (f.isDir() && t.isDir()) {
            var sum=0;
            f.recursive(function (src) {
                var rel=src.relPath(f);
                var dst=t.rel(rel);
                if (options.test || options.v) {
                    Shell.echo((dst.exists()?"[ovr]":"[new]")+dst+"<-"+src);
                }
                if (!options.test) {
                    dst.copyFrom(src,options);
                }
                sum++;
            });
            return sum;
        } else if (!f.isDir() && !t.isDir()) {
            t.text(f.text());
            return 1;
        } else if (!f.isDir() && t.isDir()) {
            t.rel(f.name()).text(f.text());
            return 1;
        } else {
            throw "Cannot copy directory "+f+" to file "+t;
        }*/
    };
    Shell.rm=function (file, options) {
        if (!options) options={};
        if (options.notrash) {
            file=resolve(file, false);
            file.removeWithoutTrash();
            return 1;
        }
        file=resolve(file, true);
        file.rm(options);
        /*if (file.isDir() && options.r) {
            var dir=file;
            var sum=0;
            dir.each(function (f) {
                if (f.exists()) {
                    sum+=Shell.rm(f, options);
                }
            });
            dir.rm();
            return sum+1;
        } else {
            file.rm();
            return 1;
        }*/
    };
    Shell.cat=function (file,options) {
        file=resolve(file, true);
        Shell.echo(file.text());
        //else return file.text();
    };
    Shell.resolve=function (file) {
	if (!file) file=".";
	file=resolve(file);
	return file;
    };
    Shell.grep=function (pattern, file, options) {
        file=resolve(file, true);
        if (!options) options={};
        if (!options.res) options.res=[];
        if (file.isDir()) {
            file.each(function (e) {
                Shell.grep(pattern, e, options);
            });
        } else {
            if (typeof pattern=="string") {
                file.lines().forEach(function (line, i) {
                    if (line.indexOf(pattern)>=0) {
                        report(file, i+1, line);
                    }
                });
            }
        }
        return options.res;
        function report(file, lineNo, line) {
            if (options.res) {
                options.res.push({file:file, lineNo:lineNo,line:line});
            }
            Shell.echo(file+"("+lineNo+"): "+line);

        }
    };
    Shell.touch=function (f) {
    	f=resolve(f);
    	f.text(f.exists() ? f.text() : "");
    	return 1;
    };
    Shell.setout=function (ui) {
        Shell.outUI=ui;
    };
    Shell.echo=function () {
        console.log.apply(console,arguments);
        if (Shell.outUI && Shell.outUI.log) Shell.outUI.log.apply(Shell.outUI,arguments);
    };
    Shell.err=function () {
        console.log.apply(console,arguments);
        if (Shell.outUI && Shell.outUI.err) Shell.outUI.err.apply(Shell.outUI,arguments);
    };

    Shell.prompt=function () {};
    Shell.ASYNC={r:"SH_ASYNC"};
    Shell.help=function () {
        for (var k in Shell) {
            var c=Shell[k];
            if (typeof c=="function") {
                Shell.echo(k+(c.description?" - "+c.description:""));
            }
        }
    };
    sh=Shell;
    if (WebSite.isNW) {
        sh.devtool=function () { require('nw.gui').Window.get().showDevTools();}
    }
    return Shell;
});

define('exceptionCatcher',[], function () {
    var res={};
    res.f=function (f) {
        if (typeof f=="function") {
            if (f.isTrcf) return f;
            var r=function () {
                if (res.handleException && !res.enter) {
                    try {
                        res.enter=true;
                        return f.apply(this,arguments);
                    } catch (e) {
                        res.handleException(e);
                    } finally {
                        res.enter=false;
                    }
                } else {
                    return f.apply(this,arguments);
                }
            };
            r.isTrcf=true;
            return r;
        } else if(typeof f=="object") {
            for (var k in f) {
                f[k]=res.f(f[k]);
            }
            return f;
        }
    };
    //res.handleException=function (){};
    return res;
});
define('UI',["Util","exceptionCatcher"],function (Util, EC) {
    var UI={};
    var F=EC.f;
    UI=function () {
        var expr=[];
        for (var i=0 ; i<arguments.length ; i++) {
            expr[i]=arguments[i];
        }
        var listeners=[];
        var $vars={};
        var $edits=[];
        var res=parse(expr);
        res.$edits=$edits;
        res.$vars=$vars;
        $edits.load=function (model) {
            $edits.model=model;
            $edits.forEach(function (edit) {
                $edits.writeToJq(edit.params.$edit, edit.jq);
            });
        };
        $edits.writeToJq=function ($edit, jq) {
        	var m=$edits.model;
            if (!m) return;
            var name = $edit.name;
            var a=name.split(".");
            for (var i=0 ; i<a.length ;i++) {
                m=m[a[i]];
            }
            m=$edit.type.toVal(m);
            if (jq.attr("type")=="checkbox") {
                jq.prop("checked",!!m);
            } else {
                jq.val(m);
            }
        };
        $edits.validator={
       		errors:{},
       		show: function () {
       			if ($vars.validationMessage) {
       				$vars.validationMessage.empty();
       				for (var name in this.errors) {
       					$vars.validationMessage.append(UI("div", this.errors[name].mesg));
       				}
       			}
       			if ($vars.OKButton) {
       				var ok=true;
       				for (var name in this.errors) {
       					ok=false;
       				}
       				$vars.OKButton.attr("disabled", !ok);
       			}
       		},
       		on: {
       			validate: function () {}
       		},
       		addError: function (name, mesg, jq) {
       			this.errors[name]={mesg:mesg, jq:jq};
       			this.show();
       		},
       		removeError: function (name) {
       			delete this.errors[name];
       			this.show();
       		},
       		allOK: function () {
       			for (var i in this.errors) {
       				delete this.errors[i];
       			}
       			this.show();
       		},
       		isValid: function () {
       		    var res=true;
       		    for (var i in this.errors) res=false;
       		    return res;
       		}
        };
        $edits.writeToModel=function ($edit, val ,jq) {
            var m=$edits.model;
        	//console.log($edit, m);
            if (!m) return;
            var name = $edit.name;
            try {
                val=$edit.type.fromVal(val);
            } catch (e) {
            	$edits.validator.addError(name, e, jq);
            	//$edits.validator.errors[name]={mesg:e, jq:jq};
                //$edits.validator.change(name, e, jq);
                return;
            }
            $edits.validator.removeError(name);
            /*
            if ($edits.validator.errors[name]) {
                delete $edits.validator.errors[name];
                $edits.validator.change(name, null, jq);
            }*/
            var a=name.split(".");
            for (var i=0 ; i<a.length ;i++) {
                if (i==a.length-1) {
                    if ($edits.on.writeToModel(name,val)) {

                    } else {
                        m[a[i]]=val;
                    }
                } else {
                    m=m[a[i]];
                }
            }
            $edits.validator.on.validate.call($edits.validator, $edits.model);
        };
        $edits.on={};
        $edits.on.writeToModel= function (name, val) {};

        if (listeners.length>0) {
            setTimeout(F(l),10);
        }
        function l() {
            listeners.forEach(function (li) {
                li();
            });
            setTimeout(F(l),10);
        }
        return res;
        function parse(expr) {
            if (expr instanceof Array) return parseArray(expr);
            else if (typeof expr=="string") return parseString(expr);
            else return expr;
        }
        function parseArray(a) {
            var tag=a[0];
            var i=1;
            var res=$("<"+tag+">");
            if (typeof a[i]=="object" && !(a[i] instanceof Array) && !(a[i] instanceof $) ) {
                parseAttr(res, a[i],tag);
                i++;
            }
            while (i<a.length) {
                res.append(parse(a[i]));
                i++;
            }
            return res;
        }
        function parseAttr(jq, o, tag) {
            if (o.$var) {
                $vars[o.$var]=jq;
            }
            if (o.$edit) {
                if (typeof o.$edit=="string") {
                    o.$edit={name: o.$edit, type: UI.types.String};
                }
                if (!o.on) o.on={};
                o.on.realtimechange=F(function (val) {
                    $edits.writeToModel(o.$edit, val, jq);
                });
                if (!$vars[o.$edit.name]) $vars[o.$edit.name]=jq;
                $edits.push({jq:jq,params:o});
            }
            for (var k in o) {
                if (k=="on") {
                    for (var e in o.on) on(e, o.on[e]);
                } else if (k=="css") {
                    jq.css(o[k]);
                } else if (!Util.startsWith(k,"$")){
                    jq.attr(k,o[k]);
                }
            }
            function on(eType, li) {
                if (eType=="enterkey") {
                    jq.on("keypress",F(function (ev) {
                        if (ev.which==13) li.apply(jq,arguments);
                    }));
                } else if (eType=="realtimechange") {
                    var first=true, prev;
                    listeners.push(function () {
                        var cur;
                        if (o.type=="checkbox") {
                            cur=!!jq.prop("checked");
                        } else {
                            cur=jq.val();
                        }
                        if (first || prev!=cur) {
                            li.apply(jq,[cur,prev]);
                            prev=cur;
                        }
                        first=false;
                    });
                } else {
                    jq.on(eType, F(li));
                }
            }
        }
        function parseString(str) {
            return $("<span>").text(str);
        }
    };
    UI.types={
       String: {
           toVal: function (val) {
               return val;
           },
           fromVal: function (val) {
               return val;
           }
       },
       Number: {
           toVal: function (val) {
               return val+"";
           },
           fromVal: function (val) {
               return parseFloat(val);
           }
       }
   };
    return UI;
});

define('Shell2',["Shell","UI","FS","Util"], function (sh,UI,FS,Util) {
    var res={};
    res.show=function (dir) {
        var d=res.embed(dir);
        d.dialog({width:600,height:500});
    };
    res.embed=function (dir) {
        if (!res.d) {
            res.d=UI("div",{title:"Shell"},["div",{$var:"inner"},"Type 'help' to show commands.",["br"]]);
            res.inner=res.d.$vars.inner;
            sh.prompt();
        }
        var d=res.d;
        return d;
    };
    sh.cls=function () {
        res.d.$vars.inner.empty();
    };
    sh.prompt=function () {
        var line=UI("div",
            ["input",{$var:"cmd",size:40,on:{keydown: kd}}],
            ["pre",{$var:"out","class":"shell out"},["div",{$var:"cand","class":"shell cand"}]]
        );
        var cmd=line.$vars.cmd;
        var out=line.$vars.out;
        var cand=line.$vars.cand;
        sh.setout({log:function () {
            var a=[];
            for (var i=0; i<arguments.length; i++) {
                a.push(arguments[i]);
            }
            out.append(a.join(" ")+"\n");
        },err:function (e) {
            out.append(UI("div",{"class": "shell error"},e,["br"],["pre",e.stack]));
        }});
        line.appendTo(res.inner);
        cmd.focus();
        res.inner.closest(".ui-dialog-content").scrollTop(res.inner.height());
        return sh.ASYNC;
        function kd(e) {
            //var eo=e.originalEvent();
            //console.log(e.which);
            if (e.which==9) {
                e.stopPropagation();
                e.preventDefault();
                comp();
                return false;
            }
            if (e.which==13) {
                cand.empty();
                exec(cmd.val());
            }
        }
        function exec() {
            var c=cmd.val().replace(/^ */,"").replace(/ *$/,"");
            if (c.length==0) return;
            var cs=c.split(/ +/);
            var cn=cs.shift();
            var f=sh[cn];
            if (typeof f!="function") return out.append(cn+": command not found.");
            try {
                var args=[],options=null;
                cs.forEach(function (ce) {
                    var opt=/^-([A-Za-z_0-9]+)(=(.*))?/.exec(ce);
                    if (opt) {
                        if (!options) options={};
                        options[opt[1]]=opt[3]!=null ? opt[3] : 1;
                    } else args.push(ce);
                });
                if (options) args.push(options);
                var sres=f.apply(sh, args);
                if (sres===sh.ASYNC) return;
                $.when(sres).then(function (sres){
                    if (typeof sres=="object") {
                        if (sres instanceof Array) {
                            var table=UI("table");
                            var tr=null;
                            var cnt=0;
                            sres.forEach(function (r) {
                                if (!tr) tr=UI("tr").appendTo(table);
                                tr.append(UI("td",r));
                                cnt++;if(cnt%3==0) tr=null;
                            });
                            table.appendTo(out);
                        } else {
                            out.append(JSON.stringify(sres));
                        }
                    } else {
                        out.append(sres);
                    }
                    sh.prompt();
                });
            } catch(e) {
                sh.err(e);
                //out.append(UI("div",{"class": "shell error"},e,["br"],["pre",e.stack]));
                sh.prompt();
            }
        }
        function comp(){
            var c=cmd.val();
            var cs=c.split(" ");
            var fn=cs.pop();
            var canda=[];
            if (cs.length==0) {
                for (var k in sh) {
                    if (typeof sh[k]=="function" && Util.startsWith(k, fn)) {
                        canda.push(k);
                    }
                }
            } else {
                var f=sh.resolve(fn,false);
                //console.log(fn,f);
                if (!f) return;
                var d=(f.isDir() ? f : f.up());
                d.each(function (e) {
                    if ( Util.startsWith(e.path(), f.path()) ) {
                        canda.push(e.name());
                    }
                });
            }
            if (canda.length==1) {
                var fns=fn.split("/");
                fns.pop();
                fns.push(canda[0]);
                cs.push(fns.join("/"));
                cmd.val(cs.join(" "));
                cand.empty();
            } else {
                cand.text(canda.join(", "));
            }
            //console.log(canda);
            //cmd.val(cmd.val()+"hokan");
        }
    };
    sh.window=function () {
        res.show(sh.cwd);
    };
    sh.atest=function (a,b,options) {
        console.log(a,b,options);
    };
    return res;
});
if (typeof define!=="function") {
    define=require("requirejs").define;
}
define('Tonyu',[],function () {
return Tonyu=function () {
    var preemptionTime=60;
    function thread() {
        //var stpd=0;
        var fb={enter:enter, apply:apply,
                exit:exit, steps:steps, step:step, isAlive:isAlive, isWaiting:isWaiting,
                suspend:suspend,retVal:0/*retVal*/,tryStack:[],
                kill:kill, waitFor: waitFor,setGroup:setGroup,
                enterTry:enterTry,exitTry:exitTry,startCatch:startCatch,
                waitEvent:waitEvent,runAsync:runAsync,clearFrame:clearFrame};
        var frame=null;
        var _isAlive=true;
        var cnt=0;
        //var retVal;
        var _isWaiting=false;
        var fSuspended=false;
        function isAlive() {
            return frame!=null && _isAlive;
        }
        function isWaiting() {
            return _isWaiting;
        }
        function suspend() {
            //throw new Error("Suspend call");
            fSuspended=true;
            cnt=0;
        }
        function enter(frameFunc) {
            frame={prev:frame, func:frameFunc};
        }
        function apply(obj, methodName, args) {
            if (!args) args=[];
            var method;
            if (typeof methodName=="string") {
                method=obj["fiber$"+methodName];
            }
            if (typeof methodName=="function") {
                method=methodName.fiber;
            }
            args=[fb].concat(args);
            var pc=0;
            enter(function () {
                switch (pc){
                case 0:
                    method.apply(obj,args);
                    pc=1;break;
                case 1:
                    exit();
                    pc=2;break;
                }
            });
        }
        function step() {
            if (frame) {
                try {
                    frame.func(fb);
                } catch(e) {
                    gotoCatch(e);
                }
            }
        }
        function gotoCatch(e) {
            if (fb.tryStack.length==0) {
                kill();
                handleEx(e);
                return;
            }
            fb.lastEx=e;
            var s=fb.tryStack.pop();
            while (frame) {
                if (s.frame===frame) {
                    fb.catchPC=s.catchPC;
                    break;
                } else {
                    frame=frame.prev;
                }
            }
        }
        function startCatch() {
            var e=fb.lastEx;
            fb.lastEx=null;
            return e;
        }
        function exit(res) {
            frame=(frame ? frame.prev:null);
            //if (frame) frame.res=res;
            fb.retVal=res;
        }
        function enterTry(catchPC) {
            fb.tryStack.push({frame:frame,catchPC:catchPC});
        }
        function exitTry() {
            fb.tryStack.pop();
        }
        function waitEvent(obj,eventSpec) { // eventSpec=[EventType, arg1, arg2....]
            suspend();
            if (!obj.on) return;
            var h;
            eventSpec=eventSpec.concat(function () {
                fb.lastEvent=arguments;
                fb.retVal=arguments[0];
                h.remove();
                steps();
            });
            h=obj.on.apply(obj, eventSpec);
        }
        function runAsync(f) {
            var succ=function () {
                fb.retVal=arguments;
                steps();
            };
            var err=function () {
                var msg="";
                for (var i=0; i<arguments.length; i++) {
                    msg+=arguments[i]+",";
                }
                if (msg.length==0) msg="Async fail";
                var e=new Error(msg);
                e.args=arguments;
                gotoCatch(e);
                steps();
            };
            f(succ,err);
            suspend();
        }
        function waitFor(j) {
            _isWaiting=true;
            suspend();
            if (j && j.addTerminatedListener) j.addTerminatedListener(function () {
                _isWaiting=false;
                if (fb.group) fb.group.notifyResume();
                else if (isAlive()) {
                    try {
                        fb.steps();
                    }catch(e) {
                        handleEx(e);
                    }
                }
                //fb.group.add(fb);
            });
        }
        function setGroup(g) {
            fb.group=g;
            if (g) g.add(fb);
        }
        /*function retVal() {
            return retVal;
        }*/
        function steps() {
            //stpd++;
            //if (stpd>5) throw new Error("Depth too much");
            var sv=Tonyu.currentThread;
            Tonyu.currentThread=fb;
            //var lim=new Date().getTime()+preemptionTime;
            cnt=preemptionTime;
            fb.preempted=false;
            fSuspended=false;
            //while (new Date().getTime()<lim) {
            while (cnt-->0 && frame) {
                step();
            }
            fb.preempted= (!fSuspended) && isAlive();
            //stpd--;
            Tonyu.currentThread=sv;
        }
        function kill() {
            _isAlive=false;
            frame=null;
        }
        function clearFrame() {
            frame=null;
            tryStack=[];
        }
        return fb;
    }
    function timeout(t) {
        var res={};
        var ls=[];
        res.addTerminatedListener=function (l) {
            ls.push(l);
        };
        setTimeout(function () {
            ls.forEach(function (l) {
                l();
            });
        },t);
        return res;
    }
    function asyncResult() {
        var res=[];
        var ls=[];
        var hasRes=false;
        res.addTerminatedListener=function (l) {
            if (hasRes) setTimeout(l,0);
            else ls.push(l);
        };
        res.receiver=function () {
            hasRes=true;
            for (var i=0; i<arguments.length; i++) {
                res[i]=arguments[i];
            }
            res.notify();
        };
        res.notify=function () {
            ls.forEach(function (l) {
                l();
            });
        };
        return res;
    }
    function threadGroup() {//@deprecated
        var threads=[];
        var waits=[];
        var _isAlive=true;
        var thg;
        var _isWaiting=false;
        var willAdd=null;
        function add(thread) {
            thread.group=thg;
            if (willAdd) {
                willAdd.push(thread);
            } else {
                threads.push(thread);
            }
        }
        function addObj(obj, methodName,args) {
            if (!methodName) methodName="main";
            var th=thread();
            th.apply(obj,methodName,args);
            //obj["fiber$"+methodName](th);
            add(th);
            return th;
        }
        function steps() {
            try {
                stepsNoEx();
            } catch(e) {
                handleEx(e);
            }
        }
        function stepsNoEx() {
            for (var i=threads.length-1; i>=0 ;i--) {
                var thr=threads[i];
                if (thr.isAlive() && thr.group===thg) continue;
                threads.splice(i,1);
            }
            _isWaiting=true;
            willAdd=[];
            threads.forEach(iter);
            while (willAdd.length>0) {
                w=willAdd;
                willAdd=[];
                w.forEach(function (th) {
                    threads.push(th);
                    iter(th);
                });
            }
            willAdd=null;
            function iter(th){
                if (th.isWaiting()) return;
                _isWaiting=false;
                th.steps();
            }
        }
        function kill() {
            _isAlive=false;
        }
        var _interval=0, _onStepsEnd;
        function notifyResume() {
            if (_isWaiting) {
                //console.log("resume!");
                //run();
            }
        }
        return thg={add:add, addObj:addObj,  steps:steps, kill:kill, notifyResume: notifyResume, threads:threads};
    }
    function handleEx(e) {
        if (Tonyu.onRuntimeError) {
            Tonyu.onRuntimeError(e);
        } else {
            alert ("エラー! at "+$LASTPOS+" メッセージ  : "+e);
            throw e;
        }
    }
    function defunct(f) {
        if (f===Function) {
            return null;
        }
        if (typeof f=="function") {
            f.constructor=null;
        } else if (typeof f=="object"){
            for (var i in f) {
                f[i]=defunct(f[i]);
            }
        }
        return f;
    }
    function klass() {
        var parent, prot, includes=[];
        if (arguments.length==1) {
            prot=arguments[0];
        } else if (arguments.length==2 && typeof arguments[0]=="function") {
            parent=arguments[0];
            prot=arguments[1];
        } else if (arguments.length==2 && arguments[0] instanceof Array) {
            includes=arguments[0];
            prot=arguments[1];
        } else if (arguments.length==3) {
            parent=arguments[0];
            if (!parent) {
                console.log(arguments[2]);
                throw new Error("No parent class ");
            }
            includes=arguments[1];
            prot=arguments[2];
        } else {
            console.log(arguments);
            throw "Invalid argument spec";
        }
        prot=defunct(prot);
        var res=(prot.initialize? prot.initialize:
            (parent? function () {
                parent.apply(this,arguments);
            }:function (){})
        );
        delete prot.initialize;
        //A includes B  B includes C  B extends D
        //A extends E   E includes F
        //A has methods in B,C,E,F. [Mod] A extends D.
        // Known examples:
        // Actor extends BaseActor, includes PlayMod.
        // PlayMod extends BaseActor(because use update() in play())
        res.methods=prot;
        //prot=bless(parent, prot);
        includes.forEach(function (m) {
            if (!m.methods) throw m+" Does not have methods";
            for (var n in m.methods) {
                if (!(n in prot)) {
                    prot[n]=m.methods[n];
                }
            }
            /*for (var n in m.prototype) {
                if (!(n in prot)) {  //-> cannot override color in ColorMod(MetaClicker/FlickEdit)
                //if ((typeof m.prototype[n])=="function") { //-> BodyActor::onAppear is overriden by Actor::onAppear(nop)
                    prot[n]=m.prototype[n];
                }
            }*/
        });
        res.prototype=bless(parent, prot);
        res.prototype.isTonyuObject=true;
        addMeta(res,{
            superclass:parent ? parent.meta : null,
                    includes:includes.map(function(c){return c.meta;})
        });
        var m=klass.getMeta(res);
        res.prototype.getClassInfo=function () {
            return m;
        };
        return res;
    }
    klass.addMeta=addMeta;
    function addMeta(k,m) {
        k.meta=k.meta||{};
        extend(k.meta, m);
    }
    klass.getMeta=function (k) {
        return k.meta;
    };
    klass.ensureNamespace=function (top,nsp) {
        var keys=nsp.split(".");
        var o=top;
        var i;
        for (i=0; i<keys.length; i++) {
            var k=keys[i];
            if (!o[k]) o[k]={};
            o=o[k];
        }
        return o;
    };
    klass.define=function (params) {
        // fullName, shortName,namspace, superclass, includes, methods:{name/fiber$name: func}, decls
        var parent=params.superclass;
        var includes=params.includes;
        var fullName=params.fullName;
        var shortName=params.shortName;
        var namespace=params.namespace;
        var methods=params.methods;
        var decls=params.decls;
        var nso=klass.ensureNamespace(Tonyu.classes, namespace);
        var prot=defunct(methods);
        var init=prot.initialize;
        delete prot.initialize;
        var res;
        res=(init?
            (parent? function () {
                if (!(this instanceof res)) useNew();
                if (Tonyu.runMode) init.apply(this,arguments);
                else parent.apply(this,arguments);
            }:function () {
                if (!(this instanceof res)) useNew();
                if (Tonyu.runMode) init.apply(this,arguments);
            }):
            (parent? function () {
                if (!(this instanceof res)) useNew();
                parent.apply(this,arguments);
            }:function (){
                if (!(this instanceof res)) useNew();
            })
        );
        nso[shortName]=res;
        res.methods=prot;
        includes.forEach(function (m) {
            if (!m.methods) throw m+" Does not have methods";
            for (var n in m.methods) {
                if (!(n in prot)) {
                    prot[n]=m.methods[n];
                }
            }
        });
        var props={};
        var propReg=/^__([gs]et)ter__(.*)$/;
        for (var k in prot) {
            if (k.match(/^fiber\$/)) continue;
            if (prot["fiber$"+k]) {
                prot[k].fiber=prot["fiber$"+k];
                prot[k].fiber.methodInfo={name:k,klass:res,fiber:true};
            }
            prot[k].methodInfo={name:k,klass:res};
            var r=propReg.exec(k);
            if (r) {
                props[r[2]]=props[r[2]]||{};
                props[r[2]][r[1]]=prot[k];
            }
        }
        res.prototype=bless(parent, prot);
        res.prototype.isTonyuObject=true;
        for (var k in props) {
            Object.defineProperty(res.prototype, k , props[k]);
        }
        addMeta(res,{
            fullName:fullName,shortName:shortName,namepsace:namespace,decls:decls,
            superclass:parent ? parent.meta : null,func:res,
            includes:includes.map(function(c){return c.meta;})
        });
        var m=klass.getMeta(res);
        res.prototype.getClassInfo=function () {
            return m;
        };
        return res;
    };
    function bless( klass, val) {
        if (!klass) return val;
        return extend( new klass() , val);
    }
    function extend (dst, src) {
        if (src && typeof src=="object") {
            for (var i in src) {
                dst[i]=src[i];
            }
        }
        return dst;
    }
    //alert("init");
    var globals={};
    var classes={};
    function setGlobal(n,v) {
        globals[n]=v;
    }
    function getGlobal(n) {
        return globals[n];
    }
    function getClass(n) {
        //CFN: n.split(".")
        var ns=n.split(".");
        var res=classes;
        ns.forEach(function (na) {
            if (!res) return;
            res=res[na];
        });
        if (!res && ns.length==1) {
            var found;
            for (var nn in classes) {
                var nr=classes[nn][n];
                if (nr) {
                    if (!res) { res=nr; found=nn+"."+n; }
                    else throw new Error("曖昧なクラス名： "+nn+"."+n+", "+found);
                }
            }
        }
        return res;//classes[n];
    }
    function bindFunc(t,meth) {
        var res=function () {
            return meth.apply(t,arguments);
        };
        res.methodInfo=Tonyu.extend({thiz:t},meth.methodInfo||{});
        if (meth.fiber) {
            res.fiber=function fiber_func() {
                return meth.fiber.apply(t,arguments);
            };
            res.fiber.methodInfo=Tonyu.extend({thiz:t},meth.fiber.methodInfo||{});
        }
        return res;
    }
    function invokeMethod(t, name, args, objName) {
        if (!t) throw new Error(objName+"(="+t+")のメソッド "+name+"を呼び出せません");
        var f=t[name];
        if (typeof f!="function") throw new Error((objName=="this"? "": objName+".")+name+"(="+f+")はメソッドではありません");
        return f.apply(t,args);
    }
    function callFunc(f,args, fName) {
        if (typeof f!="function") throw new Error(fName+"は関数ではありません");
        return f.apply({},args);
    }
    function checkNonNull(v, name) {
        if (v!=v || v==null) throw new Error(name+"(="+v+")は初期化されていません");
        return v;
    }
    function A(args) {
        var res=[];
        for (var i=1 ; i<args.length; i++) {
            res[i-1]=args[i];
        }
        return res;
    }
    function useNew() {
        throw new Error("クラス名はnewをつけて呼び出して下さい。");
    }
    function not_a_tonyu_object(o) {
        console.log("Not a tonyu object: ",o);
        throw new Error(o+" is not a tonyu object");
    }
    function hasKey(k, obj) {
        return k in obj;
    }
    return Tonyu={thread:thread, threadGroup:threadGroup, klass:klass, bless:bless, extend:extend,
            globals:globals, classes:classes, setGlobal:setGlobal, getGlobal:getGlobal, getClass:getClass,
            timeout:timeout,asyncResult:asyncResult,bindFunc:bindFunc,not_a_tonyu_object:not_a_tonyu_object,
            hasKey:hasKey,invokeMethod:invokeMethod, callFunc:callFunc,checkNonNull:checkNonNull,
            VERSION:1444552907324,//EMBED_VERSION
            A:A};
}();
});
define('Tonyu.Iterator',["Tonyu"], function (T) {
   function IT(set, arity) {
       var res={};
       if (set.tonyuIterator) {
    	   return set.tonyuIterator(arity);
       } else if (set instanceof Array) {
           res.i=0;
           if (arity==1) {
               res.next=function () {
                   if (res.i>=set.length) return false;
                   this[0]=set[res.i];
                   res.i++;
                   return true;
               };
           } else {
               res.next=function () {
                   if (res.i>=set.length) return false;
                   this[0]=res.i;
                   this[1]=set[res.i];
                   res.i++;
                   return true;
               };
           }
       } else if (set instanceof Object){
           res.i=0;
           var elems=[];
           if (arity==1) {
               for (var k in set) {
                   elems.push(k);
               }
               res.next=function () {
                   if (res.i>=elems.length) return false;
                   this[0]=elems[res.i];
                   res.i++;
                   return true;
               };
           } else {
               for (var k in set) {
                   elems.push([k, set[k]]);
               }
               res.next=function () {
                   if (res.i>=elems.length) return false;
                   this[0]=elems[res.i][0];
                   this[1]=elems[res.i][1];
                   res.i++;
                   return true;
               };
           }
       } else {
           console.log(set);
           throw new Error(set+" is not iterable");
       }
       return res;
   }
   Tonyu.iterator=IT;
    return IT;
});
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('IndentBuffer',[],function () {
return IndentBuffer=function () {
	var $=function () {
		var args=arguments;
		var fmt=args[0];
		//console.log(fmt+ " -- "+arguments[0]+" --- "+arguments.length);
		var ai=0;
		function shiftArg() {
			ai++;
			var res=args[ai];
			if (res==null) {
			    console.log(args);
			    throw new Error(ai+"th null param: fmt="+fmt);
			}
			return res;
		}
		function nc(val, msg) {
		    if(val==null) throw msg;
		    return val;
		}
		while (true) {
			var i=fmt.indexOf("%");
			if (i<0) {$.buf+=fmt; break;}
			$.buf+=fmt.substring(0,i);
			i++;
			var fstr=fmt.charAt(i);
			if (fstr=="s") {
				var str=shiftArg();
				if (typeof str == "string" || typeof str =="number") {}
				else if (str==null) str="null";
				else if (str.text) str=str.text;
				$.buf+=str;
				i++;
			} else if (fstr=="d") {
                var n=shiftArg();
                if (typeof n!="number") throw new Error (n+" is not a number: fmt="+fmt);
                $.buf+=n;
                i++;
			} else if (fstr=="n") {
				$.ln();
				i++;
			} else if (fstr=="{") {
				$.indent();
				i++;
			} else if (fstr=="}") {
				$.dedent();
				i++;
			} else if (fstr=="%") {
				$.buf+="%";
			} else if (fstr=="f") {
				shiftArg()($);
				i++;
            } else if (fstr=="l") {
                var lit=shiftArg();
                $.buf+=$.toLiteral(lit);
                i++;
			} else if (fstr=="v") {
			    var a=shiftArg();
			    if (!a) throw new Error ("Null %v");
                if (typeof a!="object") throw new Error("nonobject %v:"+a);
				$.visitor.visit(a);
				i++;
            } else if (fstr=="z") {
                var place=shiftArg();
                if ("val" in place) {
                    $.buf+=place.val;
                    return;
                }
                if (!place.gen) {
                    /*place.gen=("GENERETID"+Math.random()+"DITERENEG").replace(/\W/g,"");
                    place.reg=new RegExp(place.gen,"g");
                    //place.src=place.gen;
                    place.put=function (val) {
                        this.val=val;
                        $.buf=$.buf.replace(this.reg, val);
                        return val;
                    };*/
                    $.lazy(place);
                }
                $.buf+=place.gen;
                i++;
			} else if (fstr=="j") {
                var sp_node=shiftArg();
                var sp=sp_node[0];
                var node=sp_node[1];
                var sep=false;
                if (!node || !node.forEach) {
                    console.log(node);
                    throw new Error (node+" is not array. cannot join fmt:"+fmt);
                }
                node.forEach(function (n) {
                    if (sep) $.printf(sp);
                    sep=true;
                    $.visitor.visit(n);
                });
                i++;
			} else if (fstr=="D"){
			    shiftArg();
			    i++;
			} else {
				i+=2;
			}
			fmt=fmt.substring(i);
		}
	};
	$.print=function (v) {
	    $.buf+=v;
	};
	$.printf=$;
	$.buf="";
	$.lazy=function (place) {
	    if (!place) place={};
	    place.gen=("GENERETID"+Math.random()+"DITERENEG").replace(/\W/g,"");
        place.reg=new RegExp(place.gen,"g");
        //place.src=place.gen;
        place.put=function (val) {
            this.val=val;
            $.buf=$.buf.replace(this.reg, val);
            return val;
        };
        return place;
        //return {put: function () {} };
	};
	$.ln=function () {
		$.buf+="\n"+$.indentBuf;
	};
	$.indent=function () {
		$.indentBuf+=$.indentStr;
		$.buf+="\n"+$.indentBuf;
	};
	$.dedent = function () {
		var len=$.indentStr.length;
		if (!$.buf.substring($.buf.length-len).match(/^\s*$/)) {
			console.log($.buf);
			throw new Error ("Non-space truncated ");
		}
		$.buf=$.buf.substring(0,$.buf.length-len);
		$.indentBuf=$.indentBuf.substring(0 , $.indentBuf.length-len);
	};
	$.toLiteral= function (s, quote) {
        if (!quote) quote="'";
        s = s.replace(/\\/g, "\\\\");
        s = s.replace(/\r/g, "\\r");
        s = s.replace(/\n/g, "\\n");
        if (quote=="'") s = s.replace(/'/g, "\\'");
        else s = s.replace(/"/g, '\\"');
        return quote + s + quote;
    };
	$.indentBuf="";
	$.indentStr="  ";
	return $;
};
});
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('disp',["IndentBuffer"], function(IndentBuffer) {
// オブジェクトの内容を表示する． デバッグ用
return disp=function (a) {
	var p=IndentBuffer();
	function disp2(a) {
		if (a==null) return p("null%n");
		if (typeof a == "string" )
			return p("'%s'%n",a);
		if (typeof a =="number")
			return p("%s%n",a);
		if (typeof a=="function") return p("func%n");
		if (a instanceof Array) p("[%{");
		else p("{%{");
		var c = "";
		for (var i in a) {
			p(c + i+":");
			disp2(a[i]);
		}
		if (a instanceof Array) p("%}]%n");
		else  p("%}}%n");
	}
	disp2(a);
	return p.buf;
};
});
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('Parser',["disp"],function(disp) {
return Parser=function () {
    function extend(dst, src) {
        var i;
        for(i in src){
            dst[i]=src[i];
        }
        return dst;
    }
    var $={
        consoleBuffer:"",
        options: {traceTap:false, optimizeFirst: true, profile: false ,
        verboseFirst: false,traceFirstTbl:false},
        Parser: Parser,
        StringParser: StringParser,
        nc: nc
    };
    $.dispTbl=function (tbl) {
    	var buf="";
    	var h={};
    	if (!tbl) return buf;
    	for (var i in tbl) {// tbl:{char:Parser}   i:char
    		var n=tbl[i].name;
    		if (!h[n]) h[n]="";
    		h[n]+=i;
    	}
    	for (var n in h) {
    		buf+=h[n]+"->"+n+",";
    	}
    	return buf;
    }
    //var console={log:function (s) { $.consoleBuffer+=s; }};
    function _debug(s) {console.log(s);}
    function Parser(parseFunc){
    	if ($.options.traceTap) {
    		this.parse=function(s){
    			console.log("tap: name="+this.name+"  pos="+(s?s.pos:"?"));
    			var r=parseFunc.apply(this,[s]);
    			var img="NOIMG";
    			if (r.src && r.src.str) {
    				img=r.src.str.substring(r.pos-3,r.pos)+"^"+r.src.str.substring(r.pos,r.pos+3);
    			}
    			if (r.src && r.src.tokens) {
					img=r.src.tokens[r.pos-1]+"["+r.src.tokens[r.pos]+"]"+r.src.tokens[r.pos+1];
    			}

    			console.log("/tap: name="+this.name+
    					" pos="+(s?s.pos:"?")+"->"+(r?r.pos:"?")+" "+img+" res="+(r?r.success:"?"));
    			return r;
    		};
    	} else {
            this.parse=parseFunc;
    	}
    };
    Parser.create=function(parseFunc) { // (State->State)->Parser
        return new Parser(parseFunc);
    };
    $.create=Parser.create;
    function nc(v,name) {
    	if (v==null) throw name+" is null!";
    	return v;
    }
    extend(Parser.prototype, {// class Parser
        // Parser.parse:: State->State
        except: function (f) {
        	var t=this;
        	return this.ret(Parser.create(function (res) {
                //var res=t.parse(s);
                //if (!res.success) return res;
        		if (f.apply({}, res.result)) {
        			res.success=false;
        		}
        		return res;
        	}).setName("(except "+t.name+")"));
        },
        noFollow: function (p) {
            var t=this;
            nc(p,"p");
            return this.ret(Parser.create(function (res) {
                //var res=t.parse(s);
                //if (!res.success) return res;
                var res2=p.parse(res);
                res.success=!res2.success;
                return res;
            }).setName("("+t.name+" noFollow "+p.name+")"));
        },
        andNoUnify: function(next) {// Parser.and:: (Function|Parser)  -> Parser
        	nc(next,"next"); // next==next
        	var t=this; // Parser
            var res=Parser.create(function(s){ //s:State
            	var r1=t.parse(s); // r1:State
                if (!r1.success) return r1;
                var r2=next.parse(r1); //r2:State
                if (r2.success) {
                    r2.result=r1.result.concat(r2.result); // concat===append built in func in Array
                }
                return r2;
            });
            return res.setName("("+this.name+" "+next.name+")");
        },
        and: function(next) {// Parser.and:: Parser  -> Parser
            var res=this.andNoUnify(next);
            //if (!$.options.optimizeFirst) return res;
            if (!this._first) return res;
            var tbl=this._first.tbl;
            var ntbl={};
            //  tbl           ALL:a1  b:b1     c:c1
            //  next.tbl      ALL:a2           c:c2     d:d2
            //           ALL:a1>>next   b:b1>>next c:c1>>next
            for (var c in tbl) {
            	ntbl[c]=tbl[c].andNoUnify(next);
            }
            res=Parser.fromFirst(this._first.space, ntbl);
        	res.setName("("+this.name+" >> "+next.name+")");
            if ($.options.verboseFirst) {
            	console.log("Created aunify name=" +res.name+" tbl="+$.dispTbl(ntbl));
            }
            return res;
        },
        retNoUnify: function (f) {
            var t=this;
            var p;
            if (typeof f=="function") {
            	p=Parser.create(function (r1) {
                    var r2=r1.clone();
                    r2.result=[ f.apply({}, r1.result) ];
                    return r2;
            	}).setName("retfunc");
            } else p=f;
            var res=Parser.create(function(s){ //s:State
                var r1=t.parse(s); // r1:State
                if (!r1.success) return r1;
                return p.parse(r1);
                /*var r2=r1.clone();
                r2.result=[ f.apply({}, r1.result) ];
                return r2;*/
            }).setName("("+this.name+" >= "+p.name+")");
            return res;
        },
        ret: function(next) {// Parser.ret:: (Function|Parser)  -> Parser
        	if (!this._first) return this.retNoUnify(next);
            var tbl=this._first.tbl;
            var ntbl={};
            for (var c in tbl) {
            	ntbl[c]=tbl[c].retNoUnify(next);
            }
            res=Parser.fromFirst(this._first.space, ntbl);
        	res.setName("("+this.name+" >>= "+next.name+")");
            if ($.options.verboseFirst) {
            	console.log("Created runify name=" +res.name+" tbl="+$.dispTbl(ntbl));
            }
            return res;
        },

        /*
        this._first={space: space, chars:String};
        this._first={space: space, tbl:{char:Parser}};
	*/
        first: function (space, ct) {
        	if (!$.options.optimizeFirst) return this;
        	if (space==null) throw "Space is null2!";
        	if (typeof ct=="string") {
        	        var tbl={};
        	        for (var i=0; i<ct.length ; i++) {
        	            tbl[ct.substring(i,i+1)]=this;
        	        }
        	    //this._first={space: space, tbl:tbl};
        		return Parser.fromFirst(space,tbl).setName("(fst "+this.name+")");
//        		this._first={space: space, chars:ct};
        	} else if (ct==null) {
        		return Parser.fromFirst(space,{ALL:this}).setName("(fst "+this.name+")");
        		//this._first={space:space, tbl:{ALL:this}};
        	} else if (typeof ct=="object") {
        		throw "this._first={space: space, tbl:ct}";
        	}
        	return this;
        },
        firstTokens: function (tokens) {
        	if (!$.options.optimizeFirst) return this;
        	if (typeof tokens=="string") tokens=[tokens];
            var tbl={};
       	    if (tokens) {
       	    	var t=this;
       	        tokens.forEach(function (token) {
    	            tbl[token]=t;
    	        });
        	} else {
        		tbl.ALL=this;
        	}
    		return Parser.fromFirstTokens(tbl).setName("(fstT "+this.name+")");
        },
        unifyFirst: function (other) {
        	var thiz=this;
        	function or(a,b) {
        	     if (!a) return b;
        	     if (!b) return a;
        	     return a.orNoUnify(b).checkTbl();
        	}
        	var tbl={}; // tbl.* includes tbl.ALL
        	this.checkTbl();
        	other.checkTbl();
        	function mergeTbl() {
        	//   {except_ALL: contains_ALL}
        		var t2=other._first.tbl;
	        	//before tbl={ALL:a1, b:b1, c:c1}   t2={ALL:a2,c:c2,d:d2}
	        	//       b1 conts a1  c1 conts a1     c2 conts a2   d2 conts a2
	        	//after  tbl={ALL:a1|a2 , b:b1|a2    c:c1|c2    d:a1|d2 }
	        	var keys={};
	        	for (var k in tbl) { /*if (d) console.log("tbl.k="+k);*/ keys[k]=1;}
	        	for (var k in t2)  { /*if (d) console.log("t2.k="+k);*/ keys[k]=1;}
	        	delete keys.ALL;
	        	if (tbl.ALL || t2.ALL) {
	        	    tbl.ALL=or(tbl.ALL, t2.ALL);
	        	}
	        	for (var k in keys ) {
	        		//if (d) console.log("k="+k);
	        		//if (tbl[k] && !tbl[k].parse) throw "tbl["+k+"] = "+tbl[k];
	        		//if (t2[k] && !t2[k].parse) throw "t2["+k+"] = "+tbl[k];
	        	     if (tbl[k] && t2[k]) {
	        	         tbl[k]=or(tbl[k],t2[k]);
	        	     } else if (tbl[k] && !t2[k]) {
	        	         tbl[k]=or(tbl[k],t2.ALL);
	        	     } else if (!tbl[k] && t2[k]) {
	        	         tbl[k]=or(tbl.ALL, t2[k]);
	        	     }
	        	}
        	}
        	extend(tbl, this._first.tbl);
        	mergeTbl();
        	var res=Parser.fromFirst(this._first.space, tbl).setName("("+this.name+")U("+other.name+")");
        	if ($.options.verboseFirst) console.log("Created unify name=" +res.name+" tbl="+$.dispTbl(tbl));
        	return res;
        },
        or: function(other) { // Parser->Parser
        	nc(other,"other");
          	if (this._first && other._first &&
          			this._first.space && this._first.space===other._first.space) {
            	return this.unifyFirst(other);
          	} else {
          		if ($.options.verboseFirst) {
          			console.log("Cannot unify"+this.name+" || "+other.name+" "+this._first+" - "+other._first);
          		}
          		return this.orNoUnify(other);
          	}
        },
        orNoUnify: function (other) {
           	var t=this;  // t:Parser
        	var res=Parser.create(function(s){
        		var r1=t.parse(s); // r1:State
        		if (!r1.success){
        			var r2=other.parse(s); // r2:State
        			return r2;
        		} else {
        		    return r1;
        		}
        	});
        	res.name="("+this.name+")|("+other.name+")";
        	return res;
        },
        setName: function (n) {
        	this.name=n;
        	if (this._first) {
        		/*var tbl=this._first.tbl;
        		for (var i in tbl) {
        			tbl[i].setName("(elm "+i+" of "+n+")");
        		}*/
        	}
        	return this;
        },
        profile: function (name) {
            if ($.options.profile) {
                this.parse=this.parse.profile(name || this.name);
            }
        	return this;
        },
        repN: function(min){
        	var p=this;
        	if (!min) min=0;
        	var res=Parser.create(function(s) {
        		var current=s;
        		var result=[];
        		while(true){
        			var next=p.parse(current);
        			if(!next.success) {
        				var res;
        				if (result.length>=min) {
        					res=current.clone();
        					res.result=[result];
        					res.success=true;
        					//console.log("rep0 res="+disp(res.result));
        					return res;
        				} else {
        					res=s.clone();
        					res.success=false;
        					return res;
        				}
        			} else {
        				result.push(next.result[0]);
        				current=next;
        			}
        		}
        	});
        	//if (min>0) res._first=p._first;
        	return res.setName("("+p.name+" * "+min+")");
        },
        rep0: function () { return this.repN(0); },
        rep1: function () { return this.repN(1); },
        opt: function () {
        	var t=this;
        	return Parser.create(function (s) {
        		var r=t.parse(s);
        		if (r.success) {
        			return r;
        		} else {
        			s=s.clone();
        			s.success=true;
        			s.result=[null];
        			return s;
        		}
        	}).setName("("+t.name+")?");
        },
        sep1: function(sep, valuesToArray) {
        	var value=this;
        	nc(value,"value");nc(sep,"sep");
        	var tail=sep.and(value).ret(function(r1, r2) {
                if(valuesToArray) return r2;
                return {sep:r1, value:r2};
            });
            return value.and(tail.rep0()).ret(function(r1, r2){
            	var i;
                if (valuesToArray) {
            		var r=[r1];
          			for (i in r2) {
           				r.push(r2[i]);
           			}
            		return r;
            	} else {
            		return {head:r1,tails:r2};
            	}
            }).setName("(sep1 "+value.name+"~~"+sep.name+")");
        },
        sep0: function(s){
        	return this.sep1(s,true).opt().ret(function (r) {
        		if (!r) return [];
        		return r;
        	});
        },
        tap: function (msg) {
        	return this;
        	if (!$.options.traceTap) return this;
        	if (!msg) msg="";
        	var t=this;
        	var res=Parser.create(function(s){
        		console.log("tap:"+msg+" name:"+t.name+"  pos="+(s?s.pos:"?"));
        		var r=t.parse(s);
        		var img=r.src.str.substring(r.pos-3,r.pos)+"^"+r.src.str.substring(r.pos,r.pos+3);
        		console.log("/tap:"+msg+" name:"+t.name+" pos="+(s?s.pos:"?")+"->"+(r?r.pos:"?")+" "+img+" res="+(r?r.success:"?"));
        		return r;
        	});
        	/*if (this._first) {
        		var ntbl={},tbl=this._first.tbl;
        		for (var c in tbl) {
        			ntbl=tbl[c].
        		}
        	}*/
        	return res.setName("(Tap "+t.name+")");
        },
        retN: function (i) {
        	return this.ret(function () {
        		return arguments[i];
        	})
        },
        parseStr: function (str,global) {
            var st=new State(str,global);
            return this.parse(st);
        },
    	checkTbl: function () {
    		if (!this._first) return this;
    		var tbl=this._first.tbl;
    		for (var k in tbl) {
    			if (!tbl[k].parse) throw this.name+": tbl."+k+" is not a parser :"+tbl[k];
    		}
    		return this;
    	}
    });
    function State(strOrTokens, global) { // class State
        if (strOrTokens!=null) {
            this.src={maxPos:0, global:global};// maxPos is shared by all state
            if (typeof strOrTokens=="string") {
            	this.src.str=strOrTokens;
            }
            if (strOrTokens instanceof Array) {
            	this.src.tokens=strOrTokens;
            }
            this.pos=0;
            this.result=[]
            this.success=true;
        }
    };
    extend(State.prototype, {
        clone: function() {
            var s=new State();
            s.src=this.src;
            s.pos=this.pos;
            s.result=this.result.slice();
            s.success=this.success;
            return s;
        },
        updateMaxPos:function (npos) {
        	if (npos > this.src.maxPos) {
        		this.src.maxPos=npos;
        	}
        },
        isSuccess: function () {
        	return this.success;
        },
        getGlobal: function () {
                if (!this.src.global) this.src.global={};
                return this.src.global;
        }
    });
    Parser.fromFirst=function (space, tbl) {
    	if (space=="TOKEN") {
    		return Parser.fromFirstTokens(tbl);
    	}
    	var res=Parser.create(function (s0) {
    		var s=space.parse(s0);
    		var f=s.src.str.substring(s.pos,s.pos+1);
    		if ($.options.traceFirstTbl) {
    			console.log(this.name+": first="+f+" tbl="+( tbl[f]?tbl[f].name:"-") );
    		}
    		if (tbl[f]) {
        		return tbl[f].parse(s);
    		}
    		if (tbl.ALL) return tbl.ALL.parse(s);
    		s.success=false;
    		return s;
    	});
    	res._first={space:space,tbl:tbl};
    	res.checkTbl();
    	return res;
    };
    Parser.fromFirstTokens=function (tbl) {
    	var res=Parser.create(function (s) {
    		var t=s.src.tokens[s.pos];
    		var f=t?t.type:null;
    		if ($.options.traceFirstTbl) {
    			console.log(this.name+": firstT="+f+" tbl="+( tbl[f]?tbl[f].name:"-") );
    		}
    		if (f!=null && tbl[f]) {
        		return tbl[f].parse(s);
    		}
    		if (tbl.ALL) return tbl.ALL.parse(s);
    		s.success=false;
    		return s;
    	});
    	res._first={space:"TOKEN",tbl:tbl};
    	res.checkTbl();
    	return res;
    };

    var StringParser={
        empty: Parser.create(function(state) {
        	var res=state.clone();
        	res.success=true;
        	res.result=[null]; //{length:0, isEmpty:true}];
        	return res;
        }).setName("E"),
    	fail: Parser.create(function(s){
    	    s.success=false;
    	    return s;
    	}).setName("F"),
        str: function (st) { // st:String
        	return this.strLike(function (str,pos) {
        		if (str.substring(pos, pos+st.length)===st) return {len:st.length};
        		return null;
        	}).setName(st);
        },
        reg: function (r) {//r: regex (must have ^ at the head)
        	if (!(r+"").match(/^\/\^/)) console.log("Waring regex should have ^ at the head:"+(r+""));
        	return this.strLike(function (str,pos) {
        		var res=r.exec( str.substring(pos) );
        		if (res) {
        			res.len=res[0].length;
        			return res;
        		}
        		return null;
        	}).setName(r+"");
        },
        strLike: function (func) {
        	// func :: str,pos, state? -> {len:int, other...}  (null for no match )
            return Parser.create(function(state){
                var str= state.src.str;
                if (str==null) throw "strLike: str is null!";
                var spos=state.pos;
                //console.log(" strlike: "+str+" pos:"+spos);
                var r1=func(str, spos, state);
                if ($.options.traceToken) console.log("pos="+spos+" r="+r1);
                if(r1) {
                	if ($.options.traceToken) console.log("str:succ");
                	r1.pos=spos;
                	r1.src=state.src; // insert 2013/05/01
                	var ns=state.clone();
                    extend(ns, {pos:spos+r1.len, success:true, result:[r1]});
                    state.updateMaxPos(ns.pos);
                    return ns;
                }else{
                	if ($.options.traceToken) console.log("str:fail");
                    state.success=false;
                    return state;
                }
            }).setName("STRLIKE");
        },
    	parse: function (parser, str,global) {
    		var st=new State(str,global);
    		return parser.parse(st);
    	}
    };
    //  why not eof: ? because StringParser.strLike
    StringParser.eof=StringParser.strLike(function (str,pos) {
    	if (pos==str.length) return {len:0};
    	return null;
    }).setName("EOF");
    $.StringParser=StringParser;
    var TokensParser={
    	token: function (type) {
    		return Parser.create(function (s) {
        		var t=s.src.tokens[s.pos];
        		s.success=false;
        		if (!t) return s;
        		if (t.type==type) {
            		s=s.clone();
        		    s.updateMaxPos(s.pos);
			    s.pos++;
        		    s.success=true;
        		    s.result=[t];
        		}
        		return s;
        	}).setName(type).firstTokens(type);
    	},
    	parse:function (parser, tokens, global) {
    		var st=new State(tokens,global);
    		return parser.parse(st);
    	},
    	eof: Parser.create(function (s) {
            var suc=(s.pos>=s.src.tokens.length);
            s.success=suc;
    		if (suc) {
    		    s=s.clone();
    		    s.result=[{type:"EOF"}];
    		}
    	    return s;
    	}).setName("EOT")
    };
    $.TokensParser=TokensParser;
    $.lazy=function (pf) { //   ( ()->Parser ) ->Parser
    	var p=null;
    	return Parser.create(function (st) {
    		if (!p) p=pf();
    		if (!p) throw pf+" returned null!";
    		this.name=pf.name;
    		return p.parse(st);
    	}).setName("LZ");
    };
    $.addRange=function(res, newr) {
    	if (newr==null) return res;
    	if (typeof (res.pos)!="number") {
    		res.pos=newr.pos;
    		res.len=newr.len;
    		return res;
    	}
    	var newEnd=newr.pos+newr.len;
    	var curEnd=res.pos+res.len;
    	if (newr.pos<res.pos) res.pos=newr.pos;
    	if (newEnd>curEnd) res.len= newEnd-res.pos;
    	return res;
    };
    $.setRange=function (res) {
    	if (res==null || typeof res=="string" || typeof res=="number" || typeof res=="boolean") return;
    	var exRange=$.getRange(res);
    	if (exRange!=null) return res;
    	for (var i in res) {
    		if (!res.hasOwnProperty(i)) continue;
    		var range=$.setRange(res[i]);
    		$.addRange(res,range);
    	}
    	return res;
    };

	$.getRange=function(e) {
    	if (e==null) return null;
		if (typeof e.pos!="number") return null;
		if (typeof e.len=="number") return e;
		return null;
	};
    return $;
}();

});
if (typeof define!=="function") {
   define=require("requirejs").define;
}

define('Grammar',["Parser"], function (Parser) {
Grammar=function () {
	var p=Parser;

	var $=null;
	function trans(name) {
		if (typeof name=="string") return $.get(name);
		return name;
	}
	function tap(name) {
		return p.Parser.create(function (st) {
			console.log("Parsing "+name+" at "+st.pos+"  "+st.src.str.substring(st.pos, st.pos+20).replace(/[\r\n]/g,"\\n"));
			return st;
		});
	}
	$=function (name){
		var $$={};
		$$.ands=function() {
			var p=trans(arguments[0]);  //  ;
			for (var i=1 ; i<arguments.length ;i++) {
				p=p.and( trans(arguments[i]) );
			}
			p=p.tap(name);
			$.defs[name]=p;
			var $$$={};
			$$$.autoNode=function () {
                var res=p.ret(function () {
                    var res={type:name};
                    for (var i=0 ; i<arguments.length ;i++) {
                        var e=arguments[i];
                        var rg=Parser.setRange(e);
                        Parser.addRange(res, rg);
                        res["-element"+i]=e;
                    }
                    res.toString=function () {
                        return "("+this.type+")";
                    };
                }).setName(name);
                return $.defs[name]=res;
			};
			$$$.ret=function (f) {
				if (arguments.length==0) return p;
				if (typeof f=="function") {
					return $.defs[name]=p.ret(f);
				}
				var names=[];
				var fn=function(e){return e;};
				for (var i=0 ; i<arguments.length ;i++) {
					if (typeof arguments[i]=="function") {
						fn=arguments[i];
						break;
					}
					names[i]=arguments[i];
				}
				var res=p.ret(function () {
					var res={type:name};
					res[Grammar.SUBELEMENTS]=[];
					for (var i=0 ; i<arguments.length ;i++) {
						var e=arguments[i];
						var rg=Parser.setRange(e);
						Parser.addRange(res, rg);
						if (names[i]) {
							res[names[i]]=e;
						}
						res[Grammar.SUBELEMENTS].push(e);
					}
					res.toString=function () {
						return "("+this.type+")";
					};
					return fn(res);
				}).setName(name);
				return  $.defs[name]=res;
			};
			return $$$;
		};
		$$.ors= function () {
			var p=trans(arguments[0]);
			for (var i=1 ; i<arguments.length ;i++) {
				p=p.or( trans(arguments[i]) );
			}
			return $.defs[name]=p.setName(name);
		};
		return $$;
	};

	$.defs={};
	$.get=function (name) {
		if ($.defs[name]) return $.defs[name];
		return p.lazy(function () {
			var r=$.defs[name];
		    if (!r) throw "grammar named '"+name +"' is undefined";
			return r;
		}).setName("(Lazy of "+name+")");
	};
	return $;
};
Grammar.SUBELEMENTS="[SUBELEMENTS]";
return Grammar;
});
// var b=XMLBuffer(src);
// b(node);
// console.log(b.buf);
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('XMLBuffer',["Parser"],
function(Parser) {
XMLBuffer=function (src) {
	var $;
	$=function (node, attrName){
		//console.log("genX: "+node+ " typeof = "+typeof node+"  pos="+node.pos+" attrName="+attrName+" ary?="+(node instanceof Array));
		if (node==null || typeof node=="string" || typeof node=="number") return;
		var r=Parser.getRange(node);
		if (r) {
			while ($.srcLen < r.pos) {
				$.src(src.substring($.srcLen, r.pos));
			}
		}
		if (node==null) return;
		if (attrName) $.tag("<attr_"+attrName+">");
		if (node.type) $.tag("<"+node.type+">");
		if (node.text) $.src(r.text);
		else {
			var n=$.orderByPos(node);
			n.forEach(function (subnode) {
				if (subnode.name && subnode.name.match(/^-/)) {
					$(subnode.value);
				} else {
					$(subnode.value, subnode.name);
				}
			});
		}
		if (r) {
			while ($.srcLen < r.pos+r.len) {
				$.src(src.substring($.srcLen, r.pos+r.len));
			}
		}
		if (node.type) $.tag("</"+node.type+">");
		if (attrName) $.tag("</attr_"+attrName+">");
	};
	$.orderByPos=XMLBuffer.orderByPos;/*function (node) {
		var res=[];
		if (node[XMLBuffer.SUBELEMENTS]) {
			node[XMLBuffer.SUBELEMENTS].forEach(function (e) {
				res.push(e);
			});
		} else {
			for (var i in node) {
				if (!node.hasOwnProperty(i)) continue;
				if (node[i]==null || typeof node[i]=="string" || typeof node[i]=="number") continue;
				if (typeof(node[i].pos)!="number") continue;
				if (isNaN(parseInt(i)) && !(i+"").match(/-/)) { 			res.push({name: i, value: node[i]}); }
				else { 			res.push({value: node[i]}); }
			}
		}
		res=res.sort(function (a,b) {
			return a.value.pos-b.value.pos;
		});
		return res;
	};*/
	$.src=function (str) {
		$.buf+=str.replace(/&/g,"&amp;").replace(/>/g,"&gt;").replace(/</g,"&lt;");
		$.srcLen+=str.length;
	};
	$.tag=function (str) {
		$.buf+=str;
	};

	$.buf="";
	$.srcLen=0;
	return $;
}
XMLBuffer.orderByPos=function (node) {
	var res=[];
	if (node[XMLBuffer.SUBELEMENTS]) {
		node[XMLBuffer.SUBELEMENTS].forEach(function (e) {
			res.push(e);
		});
	} else {
		for (var i in node) {
			if (!node.hasOwnProperty(i)) continue;
			if (node[i]==null || typeof node[i]=="string" || typeof node[i]=="number") continue;
			if (typeof(node[i].pos)!="number") continue;
			if (isNaN(parseInt(i)) && !(i+"").match(/-/)) { 			res.push({name: i, value: node[i]}); }
			else { 			res.push({value: node[i]}); }
		}
	}
	res=res.sort(function (a,b) {
		return a.value.pos-b.value.pos;
	});
	return res;
};
XMLBuffer.SUBELEMENTS="[SUBELEMENTS]";
return XMLBuffer;
});
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('TError',[],function () {
TError=function (mesg, src, pos) {
    if (typeof src=="string") {
        return {
            isTError:true,
            mesg:mesg,
            src:{
                name:function () { return src;},
                text:function () { return src;}
            },
            pos:pos,
            toString:function (){
                return this.mesg+" at "+src+":"+this.pos;
            },
            raise: function () {
                throw this;
            }
        };
    }
    var klass=null;
    if (src && src.src) {
        klass=src;
        src=klass.src.tonyu;
    }
    if (typeof src.name!=="function") {
        throw "src="+src+" should be file object";
    }
    var rc;
    if ( (typeof (src.text))=="function") {
        var s=src.text();
        if (typeof s=="string") {
            rc=TError.calcRowCol(s,pos);
        }
    }
    return {
        isTError:true,
        mesg:mesg,src:src,pos:pos,row:rc.row, col:rc.col, klass:klass,
        toString:function (){
            return this.mesg+" at "+this.src.name()+":"+this.row+":"+this.col;
        },
        raise: function () {
            throw this;
        }
    };
};
TError.calcRowCol=function (text,pos) {
    var lines=text.split("\n");
    var pp=0,row,col;
    for (row=0;row<lines.length ; row++) {
        pp+=lines[row].length+1;
        if (pp>pos) {
            col=pos-(pp-lines[row].length);
            break;
        }
    }
    return {row:row,col:col};
};
return TError;
});
/*sys.load("js/parser.js");
sys.load("js/ExpressionParser2Tonyu.js");
sys.load("js/GrammarTonyu.js");
sys.load("js/XMLBuffer.js");
sys.load("js/IndentBuffer.js");
sys.load("js/disp.js");
sys.load("js/profiler.js");
*/
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('TT',["Grammar", "XMLBuffer", "IndentBuffer","disp", "Parser","TError"],
function (Grammar, XMLBuffer, IndentBuffer, disp, Parser,TError) {
return TT=function () {
	function profileTbl(parser, name) {
		var tbl=parser._first.tbl;
		for (var c in tbl) {
			tbl[c].profile();//(c+" of "+tbl[name);
		}
	}
	var sp=Parser.StringParser;
	var SAMENAME="SAMENAME";
	var DIV=1,REG=2;
    var space=sp.reg(/^(\s*(\/\*([^\/]|[^*]\/|\r|\n)*\*\/)*(\/\/.*\r?\n)*)*/).setName("space");
    function tk(r, name) {
        var pat;
        var fst;
        if (typeof r=="string") {
            pat=sp.str(r);
            if (r.length>0) fst=r.substring(0,1);
            if (!name) name=r;
        } else {
            pat=sp.reg(r);
            if (!name) name=r+"";
        }
        var res=space.and(pat).ret(function(a, b) {
            var res={};
            res.pos=b.pos;
            if (typeof res.pos!="number") throw "no pos for "+name+" "+disp(b);
            res.len=b.len;
            res.text=b.src.str.substring(res.pos, res.pos+res.len);
            if (typeof res.text!="string") throw "no text("+res.text+") for "+name+" "+disp(b);
            res.toString=function (){
                return this.text;
            };
            return res;
        });
        if (fst) res=res.first(space, fst);
        return res.setName(name);//.profile();
    }
    var parsers={},posts={};
    function dtk2(prev, name, parser, post) {
    	//console.log("2reg="+prev+" name="+name);
    	if (typeof parser=="string") parser=tk(parser);
    	parsers[prev]=or(parsers[prev], parser.ret(function (res) {
    		res.type=name;
    		return res;
    	}).setName(name) );
    }
    function dtk(prev, name, parser, post) {
    	if(name==SAMENAME) name=parser;
    	for (var m=1; m<=prev; m*=2) {
    		//prev=1  -> m=1
    		//prev=2  -> m=1x,2
    		//XXprev=3  -> m=1,2,3
    		if ((prev&m)!=0) dtk2(prev&m, name,parser,post);
    	}
    	posts[name]=post;
    }
    function or(a,b){
    	if (!a) return b;
    	return a.or(b);
    }

    var all=Parser.create(function (st) {
    	var mode=REG;
    	var res=[];
    	while (true) {
        	st=parsers[mode].parse(st);
        	if (!st.success) break;
        	var e=st.result[0];
    		mode=posts[e.type];
    		res.push(e);
    	}
    	st=space.parse(st);
    	//console.log(st.src.maxPos+"=="+st.src.str.length)
    	st.success=st.src.maxPos==st.src.str.length;
    	st.result[0]=res;
    	return st;
    });
    /*function exprHead(name, parser) {
    	dtk(REG, name, parser, DIV);
    }
    function exprMid(name, parser) {
    	dtk(DIV, name, parser, REG);
    }
    function exprTail(name, parser) {
    	dtk(DIV, name, parser, DIV);
    }*/
    var reserved={"function":true, "var":true , "return":true, "typeof": true, "if":true,
            "for":true,
            "else": true,
            "super": true,
            "while":true,
            "break":true,
            "do":true,
            "switch":true,
            "try": true,
            "catch": true,
            "finally": true,
            "throw": true,
            "in": true,
            fiber:true,
            "native": true,
            "instanceof":true,
            "new": true,
            "is": true,
            "true": true,
            "false": true,
            "null":true,
            "this":true,
            "undefined": true,
            "usethread": true,
            "constructor": true,
            ifwait:true,
            nowait:true,
            _thread:true,
            arguments:true,
            "delete": true,
            "extends":true,
            "includes":true
    };

	var num=tk(/^[0-9\.]+/).ret(function (n) {
        n.type="number";
        n.value=parseInt(n.text);
        return n;
    }).first(space,"0123456789");
	var literal=tk({exec: function (s) {
        var head=s.substring(0,1);
        if (head!=='"' && head!=="'") return false;
        for (var i=1 ;i<s.length ; i++) {
            var c=s.substring(i,i+1);
            if (c===head) {
                return [s.substring(0,i+1)];
            } else if (c==="\\") {
                i++;
            }
        }
        return false;
    },toString:function(){return"literal";}
    }).first(space,"\"'");
    var regex=tk({exec: function (s) {
        if (s.substring(0,1)!=='/') return false;
        for (var i=1 ;i<s.length ; i++) {
            var c=s.substring(i,i+1);
            if (c==='/') {
                var r=/^[ig]*/.exec( s.substring(i+1) );
                return [s.substring(0,i+1+r[0].length)];
            } else if (c=="\n") {
                return false;
            } else if (c==="\\") {
                i++;
            }
        }
        return false;
    },toString:function(){return"regex";}
    }).first(space,"/");

	dtk(REG|DIV, "number", num,DIV );
	dtk(REG,  "regex" ,regex,DIV );
	dtk(REG|DIV,  "literal" ,literal,DIV );

	dtk(REG|DIV,SAMENAME ,"++",DIV );
	dtk(REG|DIV,SAMENAME ,"--",DIV );

	dtk(REG|DIV,SAMENAME ,"!==",REG );
	dtk(REG|DIV,SAMENAME ,"===",REG );
	dtk(REG|DIV,SAMENAME ,"+=",REG );
	dtk(REG|DIV,SAMENAME ,"-=",REG );
	dtk(REG|DIV,SAMENAME ,"*=",REG );
	dtk(REG|DIV,SAMENAME ,"/=",REG );
	dtk(REG|DIV,SAMENAME ,"%=",REG );
	dtk(REG|DIV,SAMENAME ,">=",REG );
	dtk(REG|DIV,SAMENAME ,"<=",REG );
	dtk(REG|DIV,SAMENAME ,"!=",REG );
	dtk(REG|DIV,SAMENAME ,"==",REG );
	dtk(REG|DIV,SAMENAME ,">>",REG );
	dtk(REG|DIV,SAMENAME ,"<<",REG );

	dtk(REG|DIV,SAMENAME ,"&&",REG );
	dtk(REG|DIV,SAMENAME ,"||",REG );


	dtk(REG|DIV,SAMENAME ,"(",REG );
	dtk(REG|DIV,SAMENAME ,")",DIV );


	dtk(REG|DIV,SAMENAME ,"[",REG );
	dtk(REG|DIV,SAMENAME ,"]",DIV );  // a[i]/3

	dtk(REG|DIV,SAMENAME ,"{",REG );
	//dtk(REG|DIV,SAMENAME ,"}",REG );  // if () { .. }  /[a-z]/.exec()
	dtk(REG|DIV,SAMENAME ,"}",DIV ); //in tonyu:  a{x:5}/3

	dtk(REG|DIV,SAMENAME ,">",REG );
	dtk(REG|DIV,SAMENAME ,"<",REG );
	dtk(REG|DIV,SAMENAME ,"+",REG );
	dtk(REG|DIV,SAMENAME ,"-",REG );
	dtk(REG|DIV, SAMENAME ,".",REG );
	dtk(REG|DIV,SAMENAME ,"?",REG );

	dtk(REG|DIV, SAMENAME ,"=",REG );
	dtk(REG|DIV, SAMENAME ,"*",REG );
	dtk(REG|DIV, SAMENAME ,"%",REG );
	dtk(DIV, SAMENAME ,"/",REG );

	dtk(DIV|REG, SAMENAME ,"^",REG );
	dtk(DIV|REG, SAMENAME ,"~",REG );

	dtk(DIV|REG, SAMENAME ,"\\",REG );
	dtk(DIV|REG, SAMENAME ,":",REG );
	dtk(DIV|REG, SAMENAME ,";",REG );
	dtk(DIV|REG, SAMENAME ,",",REG );
	dtk(REG|DIV,SAMENAME ,"!",REG );
	dtk(REG|DIV,SAMENAME ,"&",REG );
	dtk(REG|DIV,SAMENAME ,"|",REG );

    var symresv=tk(/^[a-zA-Z_$][a-zA-Z0-9_$]*/,"symresv_reg").ret(function (s) {
	s.type=(s.text=="constructor" ? "tk_constructor" :
		reserved.hasOwnProperty(s.text) ? s.text : "symbol");
	return s;
    }).first(space);
    for (var n in reserved) {
    	posts[n]=REG;
    }
    posts.tk_constructor=REG;
    posts.symbol=DIV;
    parsers[REG]=or(parsers[REG],symresv);
    parsers[DIV]=or(parsers[DIV],symresv);

//	dtk(REG|DIV, "symbol", tk(/^[a-zA-Z_$][a-zA-Z0-9_$]*/,"ident_reg").except(function (s) {
  /*      return reserved.hasOwnProperty(s.text);
    }).first(space), DIV);
    dtk(REG|DIV, "tk_constructor", "constructor", REG);
    var resvs=[];
    for (var n in reserved) {
    	if (n!="constructor") resvs.push(n);
    }
    resvs.sort(function (a,b) {
    	return b.length-a.length;
    });
    resvs.forEach(function (n) {
    	dtk(REG|DIV, SAMENAME, n, REG);
    });
*/
	//profileTbl( parsers[REG],"reg");
	//profileTbl( parsers[DIV],"div");
	//profileTbl( parsers[REG|DIV],"regdiv");
	//parsers[REG|DIV]=parsers[REG].or(parsers[DIV]);
    function parse(str) {
    	//if (str.length>100000) return;
    	var t1=new Date().getTime();
		var res=Parser.StringParser.parse(all, str);
		//console.log("Time="+(new Date().getTime()-t1));
		if (res.success) {
			/*res.result[0].forEach(function (e) {
				if (e.type=="REGEX" || e.type=="DIV") {
					console.log(e.type+"\t"+ str.substring(e.pos-5,e.pos+6));
					//console.log( e.text+"\t"+e.type+"\t"+e.pos+"-"+e.len);
				}
			});*/
		} else {
			console.log("Stopped at "+str.substring( res.src.maxPos-5, res.src.maxPos+5));
		}
		/*if (typeof WebSite=="object" && WebSite.devMode) {//DELJSL
		    window.tokenStat=window.tokenStat||{};
		    res.result[0].forEach(function (r) {
		        window.tokenStat[ r.text ]= window.tokenStat[ r.text ] || 0;
		        window.tokenStat[ r.text ]++;
		    });
		    //buf=""; for (var k in tokenStat) {  buf+=k+"\t"+tokenStat[k]+"\n"; }; buf;
		    //console.log(res);
		}*/
		return res;
		//console.log(Profiler.report());
		//console.log( disp(res.result[0]) );
    }
    return {parse:parse, extension:"js"};
}();

});
if (typeof define!=="function") {
   define=require("requirejs").define;
}

define('ExpressionParser',["Parser"], function (Parser) {
// parser.js の補助ライブラリ．式の解析を担当する
return ExpressionParser=function () {
	var $={};
	var EXPSTAT="EXPSTAT";
	//  first 10     *  +  <>  &&  ||  =     0  later
	function opType(type, prio) {
	    var $={};
	    $.eq=function (o) {return type==o.type() && prio==o.prio(); };
        $.type=function (t) { if (!t) return type; else return t==type;};
	    $.prio=function () {return prio;};
	    $.toString=function () {return "["+type+":"+prio+"]"; }
	    return $;
	}
	function composite(a) {
	    var $={};
	    var e=a;
	    $.add=function (a) {
	        if (!e) {
	            e=a;
	        } else {
	            e=e.or(a);
	        }
	    };
	    $.get=function () {
	        return e;
	    };
	    return $;
	}
	function typeComposite() {
	    var built=composite();
	    //var lastOP , isBuilt;
	    var $={};
	    $.reg=function (type, prio, a) {
	    	var opt=opType(type, prio);
	        built.add(a.ret(Parser.create(function (r) {
                r.opType=opt;
                return r;
            })).setName("(opType "+opt+" "+a.name+")") );
	    };
	    $.get=function () {return built.get();};
	    $.parse=function (st) {
	        return $.get().parse(st);
	    };
	    return $;
	}
	var prefixOrElement=typeComposite(), postfixOrInfix=typeComposite();
	var element=composite();
	var trifixes=[];
	$.element=function (e) {
        prefixOrElement.reg("element", -1, e);
        element.add(e);
	};
	$.getElement=function () {return element.get();};
	$.prefix=function (prio, pre) {
	    prefixOrElement.reg("prefix", prio, pre);
	};
	$.postfix=function (prio, post) {
        postfixOrInfix.reg("postfix", prio, post);
	};
	$.infixl =function (prio, inf) {
        postfixOrInfix.reg("infixl", prio, inf);
	};
	$.infixr =function (prio, inf) {
        postfixOrInfix.reg("infixr", prio, inf);
	};
	$.infix =function (prio, inf) {
        postfixOrInfix.reg("infix", prio, inf);
	};
	$.trifixr = function (prio, tf1, tf2) {
        postfixOrInfix.reg("trifixr", prio, tf1);
        //postfixOrInfix.reg("trifixr2", prio, tf2);
        trifixes[prio]=tf2;
	};
	$.custom = function (prio, func) {
		// func :: Elem(of next higher) -> Parser
	};
	$.mkInfix=function (f) {
		$.mkInfix.def=f;
	};
	$.mkInfix.def=function (left,op,right) {
		return Parser.setRange({type:"infix", op:op, left: left, right: right});
	}
	$.mkInfixl=function (f) {
		$.mkInfixl.def=f;
	};
	$.mkInfixl.def=function (left, op , right) {
		return Parser.setRange({type:"infixl",op:op ,left:left, right:right});
	};
	$.mkInfixr=function (f) {
		$.mkInfixr.def=f;
	};
	$.mkInfixr.def=function (left, op , right) {
		return Parser.setRange({type:"infixr",op:op ,left:left, right:right});
	};
	$.mkPrefix=function (f) {
		$.mkPrefix.def=f;
	};
	$.mkPrefix.def=function (op , right) {
		return Parser.setRange({type:"prefix", op:op, right:right});
	};
	$.mkPostfix=function (f) {
		$.mkPostfix.def=f;
	};
	$.mkPostfix.def=function (left, op) {
		return Parser.setRange({type:"postfix", left:left, op:op});
	};
	$.mkTrifixr=function(f) {
	    $.mkTrifixr.def=f;
	};
	$.mkTrifixr.def=function (left, op1, mid, op2, right) {
        return Parser.setRange({type:"trifixr", left:left, op1:op1, mid:mid, op2:op2, right:right});
	};
	$.build= function () {
	    //postfixOrInfix.build();
        //prefixOrElement.build();
	    $.built= Parser.create(function (st) {
	        return parse(0,st);
	    }).setName("ExpBuilt");
	    return $.built;
	};
	function dump(st, lbl) {
	    return ;
	    var s=st.src.str;
	    console.log("["+lbl+"] "+s.substring(0,st.pos)+"^"+s.substring(st.pos)+
	            " opType="+ st.opType+"  Succ = "+st.isSuccess()+" res="+st.result[0]);
	}
	function parse(minPrio, st) {
	    var stat=0, res=st ,  opt;
	    dump(st," start minprio= "+minPrio);
	    st=prefixOrElement.parse(st);
        dump(st," prefixorelem "+minPrio);
	    if (!st.isSuccess()) {
	        return st;
	    }
	    //p2=st.result[0];
        opt=st.opType;
	    if (opt.type("prefix") ) {
	        // st = -^elem
	        pre=st.result[0];
	        st=parse(opt.prio(), st);
	        if (!st.isSuccess()) {
	            return st;
	        }
  	        // st: Expr    st.pos = -elem^
	        var pex=$.mkPrefix.def(pre, st.result[0]);
	        res=st.clone();  //  res:Expr
	        res.result=[pex]; // res:prefixExpr  res.pos= -elem^
	        if (!st.nextPostfixOrInfix) {
	            return res;
	        }
	        // st.next =  -elem+^elem
	        st=st.nextPostfixOrInfix;  // st: postfixOrInfix
	    } else { //elem
	        //p=p2;
	        res=st.clone(); // res:elemExpr   res =  elem^
            st=postfixOrInfix.parse(st);
            if (!st.isSuccess()) {
                return res;
            }
	    }
	    // assert st:postfixOrInfix  res:Expr
	    while (true) {
	        dump(st,"st:pi"); dump(res,"res:ex");
	        opt=st.opType;
	        if (opt.prio()<minPrio) {
	            res.nextPostfixOrInfix=st;
	            return res;
	        }
	        // assert st:postfixOrInfix  res:Expr
	        if (opt.type("postfix")) {
	            // st:postfix
	            var pex=$.mkPostfix.def(res.result[0],st.result[0]);
	            res=st.clone();
	            res.result=[pex]; // res.pos= expr++^
	            dump(st, "185");
	            st=postfixOrInfix.parse(st); // st. pos= expr++--^
	            if (!st.isSuccess()) {
	                return res;
	            }
	        } else if (opt.type("infixl")){  //x+y+z
	            // st: infixl
	            var inf=st.result[0];
	            st=parse(opt.prio()+1, st);
	            if (!st.isSuccess()) {
	                return res;
	            }
	            // st: expr   st.pos=  expr+expr^
	            var pex=$.mkInfixl.def(res.result[0], inf , st.result[0]);
	            res=st.clone();
	            res.result=[pex]; //res:infixlExpr
	            if (!st.nextPostfixOrInfix) {
	                return res;
	            }
	            st=st.nextPostfixOrInfix;
	        } else if (opt.type("infixr")) { //a=^b=c
                // st: infixr
                var inf=st.result[0];
                st=parse(opt.prio() ,st);
                if (!st.isSuccess()) {
                    return res;
                }
                // st: expr   st.pos=  a=b=c^
                var pex=$.mkInfixr.def(res.result[0], inf , st.result[0]);
                res=st.clone();
                res.result=[pex]; //res:infixrExpr
                if (!st.nextPostfixOrInfix) {
                    return res;
                }
                st=st.nextPostfixOrInfix;
            } else if (opt.type("trifixr")) { //left?^mid:right
                // st: trifixr
                var left=res.result[0];
                var inf1=st.result[0];  // inf1 =  ?
                st=parse(opt.prio()+1 ,st);
                if (!st.isSuccess()) {
                    return res;
                }
                // st= expr   st.pos=  left?mid^:right
                var mid=st.result[0];
                var st=trifixes[opt.prio()].parse(st);
                // st= :      st.pos= left?mid:^right;
                if (!st.isSuccess()) {
                    return res;
                }
                var inf2= st.result[0];
                st=parse(opt.prio() ,st);
                if (!st.isSuccess()) {
                    return res;
                }
                var right=st.result[0];
                // st=right      st.pos= left?mid:right^;
                var pex=$.mkTrifixr.def(left, inf1 , mid, inf2, right);
                res=st.clone();
                res.result=[pex]; //res:infixrExpr
                if (!st.nextPostfixOrInfix) {
                    return res;
                }
                st=st.nextPostfixOrInfix;
	        } else { // infix
                // st: infixl
                var inf=st.result[0];
                st=parse(opt.prio()+1 ,st);
                if (!st.isSuccess()) {
                    return res;
                }
                // st: expr   st.pos=  expr+expr^
                var pex=$.mkInfix.def(res.result[0], inf , st.result[0]);
                res=st.clone();
                res.result=[pex]; //res:infixExpr
                if (!st.nextPostfixOrInfix) {
                    return res;
                }
                st=st.nextPostfixOrInfix;
                if (opt.prio()==st.opType.prio()) {
                    res.success=false;
                    return res;
                }
	        }
	        // assert st:postfixOrInfix  res:Expr
	    }
	}
	$.lazy = function () {
		return Parser.create(function (st) {
			return $.built.parse(st);
		});
	};
	return $;
};

});
if (typeof define!=="function") {
   define=require("requirejs").define;
}

/*
 * Tonyu2 の構文解析を行う．
 * TonyuLang.parse(src);
 *   - srcを解析して構文木を返す．構文エラーがあれば例外を投げる．
 */
define('TonyuLang',["Grammar", "XMLBuffer", "IndentBuffer", "TT",
        "disp", "Parser", "ExpressionParser", "TError"],
function (Grammar, XMLBuffer, IndentBuffer, TT,
        disp, Parser, ExpressionParser, TError) {
return TonyuLang=function () {
	var p=Parser;
	var $={};
	var g=Grammar();
    var G=g.get;

    var sp=p.StringParser;//(str);
    var tk=p.TokensParser.token;
    var num=tk("number").ret(function (n) {
        n.type="number";
        if (typeof n.text!="string") throw "No text for "+disp(n);
        n.value=parseFloat(n.text);
        if (isNaN(n.value)) throw "No value for "+disp(n);
        return n;
    });
    var symbol=tk("symbol");
    var eqq=tk("===");
    var nee=tk("!==");
    var eq=tk("==");
    var ne=tk("!=");
    var ge=tk(">=");
    var le=tk("<=");
    var gt=tk(">");
    var lt=tk("<");
    var andand=tk("&&");
    var oror=tk("||");

    var minus=tk("-");//.first(space,"-");
    var plus=tk("+");//.first(space,"+");
    var mul=tk("*");
    var div=tk("/");
    var mod=tk("%");
    var assign=tk("=");
    var literal=tk("literal");
    var regex=tk("regex");
    function retF(n) {
        return function () {
            return arguments[n];
        };
    }

    var e=ExpressionParser() ;
    var arrayElem=g("arrayElem").ands(tk("["), e.lazy() , tk("]")).ret(null,"subscript");
    var argList=g("argList").ands(tk("("), e.lazy().sep0(tk(","),true) , tk(")")).ret(null,"args");
    var member=g("member").ands(tk(".") , symbol ).ret(null,     "name" );
    var parenExpr = g("parenExpr").ands(tk("("), e.lazy() , tk(")")).ret(null,"expr");
    var varAccess = g("varAccess").ands(symbol).ret("name");
    var funcExpr_l=G("funcExpr").firstTokens(["function","\\"]);
    var funcExprArg=g("funcExprArg").ands(funcExpr_l).ret("obj");
    var objlit_l=G("objlit").firstTokens("{");
    var objlitArg=g("objlitArg").ands(objlit_l).ret("obj");
    var objOrFuncArg=objlitArg.or(funcExprArg);
    function genCallBody(argList, oof) {
    	var res=[];
    	if (argList && !argList.args) {
    		throw disp(argList);
    	}
    	if (argList) {
            var rg=Parser.getRange(argList);
            Parser.addRange(res,rg);
    	    argList.args.forEach(function (arg) {
                res.push(arg);
            });
    	}
    	oof.forEach(function (o) {
            var rg=Parser.getRange(o);
            Parser.addRange(res,rg);
    		res.push(o.obj);
    	});
    	return res;
    }
    var callBody=argList.and(objOrFuncArg.rep0()).ret(function(a,oof) {
    	return genCallBody(a,oof);
    }).or(objOrFuncArg.rep1().ret(function (oof) {
    	return genCallBody(null,oof);
    }));
    var callBodyOld=argList.or(objlitArg);
    var call=g("call").ands( callBody ).ret("args");
    var scall=g("scall").ands( callBody ).ret("args");//supercall
    var newExpr = g("newExpr").ands(tk("new"),varAccess, call.opt()).ret(null, "klass","params");
    var superExpr =g("superExpr").ands(
            tk("super"), tk(".").and(symbol).ret(retF(1)).opt() , scall).ret(
            null,                 "name",                       "params");
    var reservedConst = tk("true").or(tk("false")).
    or(tk("null")).
    or(tk("undefined")).
    or(tk("_thread")).
    or(tk("this")).
    or(tk("arguments")).ret(function (t) {
        t.type="reservedConst";
        return t;
    });
    e.element(num);
    e.element(reservedConst);
    e.element(regex);
    e.element(literal);
    e.element(parenExpr);
    e.element(newExpr);
    e.element(superExpr);
    e.element(funcExpr_l);
    e.element(objlit_l);
    e.element(G("arylit").firstTokens("["));
    e.element(varAccess);
    var prio=0;
    e.infixr(prio,assign);
    e.infixr(prio,tk("+="));
    e.infixr(prio,tk("-="));
    e.infixr(prio,tk("*="));
    e.infixr(prio,tk("/="));
    e.infixr(prio,tk("%="));
    e.infixr(prio,tk("|="));
    e.infixr(prio,tk("&="));
    prio++;
    e.trifixr(prio,tk("?"), tk(":"));
    prio++;
    e.infixl(prio,oror);
    prio++;
    e.infixl(prio,andand);
    prio++;
    e.infix(prio,tk("instanceof"));
    e.infix(prio,tk("is"));
    //e.infix(prio,tk("in"));
    e.infix(prio,eqq);
    e.infix(prio,nee);
    e.infix(prio,eq);
    e.infix(prio,ne);
    e.infix(prio,ge);
    e.infix(prio,le);
    e.infix(prio,gt);
    e.infix(prio,lt);
    prio++;
    e.postfix(prio+3,tk("++"));
    e.postfix(prio+3,tk("--"));
    e.infixl(prio,minus);
    e.infixl(prio,plus);
    prio++;
    e.infixl(prio,mul);
    e.infixl(prio,div);
    e.infixl(prio,mod);
    prio++;
    e.prefix(prio,tk("typeof"));
    e.prefix(prio,tk("delete"));
    e.prefix(prio,tk("++"));
    e.prefix(prio,tk("--"));
    e.prefix(prio,tk("+"));
    e.prefix(prio,tk("-"));
    e.prefix(prio,tk("!"));
    prio++;
//    e.postfix(prio,tk("++"));
//    e.postfix(prio,tk("--"));

    prio++;
    e.postfix(prio,call);
    e.postfix(prio,member);
    e.postfix(prio,arrayElem);
    function mki(left, op ,right) {
        var res={type:"infix",left:left,op:op,right:right};
        Parser.setRange(res);
        res.toString=function () {
            return "("+left+op+right+")";
        };
        return res;
    }
    e.mkInfixl(mki);
    e.mkInfixr(mki);
    /*e.mkPostfix(function (p) {
        return {type:"postfix", expr:p};
    });*/
    var expr=e.build().setName("expr").profile();
    var retF=function (i) { return function (){ return arguments[i];}; };

    var stmt=G("stmt").firstTokens();
    var exprstmt=g("exprstmt").ands(expr,tk(";")).ret("expr");
    g("compound").ands(tk("{"), stmt.rep0(),tk("}")).ret(null,"stmts") ;
    var elseP=tk("else").and(stmt).ret(retF(1));
    var returns=g("return").ands(tk("return"),expr.opt(),tk(";") ).ret(null,"value");
    var ifs=g("if").ands(tk("if"), tk("("), expr, tk(")"), stmt, elseP.opt() ).ret(null, null,"cond",null,"then","_else");
    /*var trailFor=tk(";").and(expr.opt()).and(tk(";")).and(expr.opt()).ret(function (s, cond, s2, next) {
        return {cond: cond, next:next  };
    });*/
    var forin=g("forin").ands(tk("var").opt(), symbol.sep1(tk(","),true), tk("in"), expr).ret(
                                       "isVar", "vars",null, "set" );
    var normalFor=g("normalFor").ands(stmt, expr.opt() , tk(";") , expr.opt()).ret(
                                     "init", "cond",     null, "next");
    /*var infor=expr.and(trailFor.opt()).ret(function (a,b) {
        if (b==null) return {type:"forin", expr: a};
        return {type:"normalFor", init:a, cond: b.cond, next:b.next  };
    });*/
    var infor=normalFor.or(forin);
    var fors=g("for").ands(tk("for"),tk("("), infor , tk(")"),"stmt" ).ret(
                               null,null,    "inFor", null   ,"loop");
    //var fors=g("for").ands(tk("for"),tk("("), tk("var").opt() , infor , tk(")"),"stmt" ).ret(null,null,"isVar", "inFor",null, "loop");
    var whiles=g("while").ands(tk("while"), tk("("), expr, tk(")"), "stmt").ret(null,null,"cond",null,"loop");
    var breaks=g("break").ands(tk("break"), tk(";")).ret("brk");
    var fins=g("finally").ands(tk("finally"), "stmt" ).ret(null, "stmt");
    var catchs=g("catch").ands(tk("catch"), tk("("), symbol, tk(")"), "stmt" ).ret(null,null,"name",null, "stmt");
    var catches=g("catches").ors("catch","finally");
    var trys=g("try").ands(tk("try"),"stmt",catches.rep1() ).ret(null, "stmt","catches");
    var throwSt=g("throw").ands(tk("throw"),expr,tk(";")).ret(null,"ex");
    var typeExpr=symbol;
    var typeDecl=g("typeDecl").ands(tk(":"),typeExpr).ret(null,"vtype");
    var varDecl=g("varDecl").ands(symbol, typeDecl.opt(), tk("=").and(expr).ret(retF(1)).opt() ).ret("name","vtype","value");
    var varsDecl= g("varsDecl").ands(tk("var"), varDecl.sep1(tk(","),true), tk(";") ).ret(null ,"decls");
    var paramDecl= g("paramDecl").ands(symbol,typeDecl.opt() ).ret("name","vtype");
    var paramDecls=g("paramDecls").ands(tk("("), paramDecl.sep0(tk(","),true), tk(")")  ).ret(null, "params");
    var setterDecl= g("setterDecl").ands(tk("="), paramDecl).ret(null,"value");
    g("funcDeclHead").ands(
            tk("nowait").opt(),
            tk("function").or(tk("fiber")).or(tk("tk_constructor")).or(tk("\\")).opt(),
            symbol.or(tk("new")) , setterDecl.opt(), paramDecls.opt(),typeDecl.opt()   // if opt this it is getter
    ).ret("nowait","ftype","name","setter", "params","rtype");
    var funcDecl=g("funcDecl").ands("funcDeclHead","compound").ret("head","body");
    var nativeDecl=g("nativeDecl").ands(tk("native"),symbol,tk(";")).ret(null, "name");
    var ifwait=g("ifWait").ands(tk("ifwait"),"stmt",elseP.opt()).ret(null, "then","_else");
    //var useThread=g("useThread").ands(tk("usethread"),symbol,"stmt").ret(null, "threadVarName","stmt");
    stmt=g("stmt").ors("return", "if", "for", "while", "break", "ifWait","try", "throw","nativeDecl", "funcDecl", "compound", "exprstmt", "varsDecl");
    // ------- end of stmts
    g("funcExprHead").ands(tk("function").or(tk("\\")), symbol.opt() ,paramDecls.opt() ).ret(null,"name","params");
    var funcExpr=g("funcExpr").ands("funcExprHead","compound").ret("head","body");
    var jsonElem=g("jsonElem").ands(
            symbol.or(literal),
            tk(":").and(expr).ret(function (c,v) {return v;}).opt()
    ).ret("key","value");
    var objlit=g("objlit").ands(tk("{"), jsonElem.sep0(tk(","),true),  tk("}")).ret(null, "elems");
    var arylit=g("arylit").ands(tk("["), expr.sep0(tk(","),true),  tk("]")).ret(null, "elems");
    var ext=g("extends").ands(tk("extends"),symbol.or(tk("null")), tk(";")).
	ret(null, "superclassName");
    var incl=g("includes").ands(tk("includes"), symbol.sep1(tk(","),true),tk(";")).
	ret(null, "includeClassNames");
    var program=g("program").
	ands(ext.opt(),incl.opt(),stmt.rep0(), Parser.TokensParser.eof).
	ret("ext","incl","stmts");

    for (var i in g.defs) {
        g.defs[i].profile();
    }
    $.parse = function (file) {
        if (typeof file=="string") {
            str=file;
        } else {
            str=file.text();
        }
        str+="\n"; // For end with // comment with no \n
	    var tokenRes=TT.parse(str);
	    if (!tokenRes.isSuccess() ) {
	    	//return "ERROR\nToken error at "+tokenRes.src.maxPos+"\n"+
		//	str.substring(0,tokenRes.src.maxPos)+"!!HERE!!"+str.substring(tokenRes.src.maxPos);
		throw TError("文法エラー(Token)", file ,  tokenRes.src.maxPos);
	    }
	    var tokens=tokenRes.result[0];
        //console.log("Tokens: "+tokens.join(","));
	    var res=p.TokensParser.parse(program, tokens);
		//console.log("POS="+res.src.maxPos);
		if (res.isSuccess() ) {
			var node=res.result[0];
			//console.log(disp(node));
			return node;
		    //var xmlsrc=$.genXML(str, node);
		    //return "<program>"+xmlsrc+"</program>";

		}
		var lt=tokens[res.src.maxPos];
		var mp=(lt?lt.pos+lt.len: str.length);
		throw TError("文法エラー", file ,  mp );
		/*return "ERROR\nSyntax error at "+mp+"\n"+
		str.substring(0,mp)+"!!HERE!!"+str.substring(mp);*/
	};
	$.genXML= function (src, node) {
		var x=XMLBuffer(src) ;
		x(node);
        return x.buf;
	};
	$.extension="tonyu";
	return $;
}();

});
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('ObjectMatcher',[],function () {
return ObjectMatcher=function () {
    var OM={};
    var VAR="$var",THIZ="$this";
    OM.v=v;
    function v(name, cond) {
        var res={};
        res[VAR]=name;
        if (cond) res[THIZ]=cond;
        return res;
    }
    OM.isVar=isVar;
    var names="ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (var i =0 ; i<names.length ; i++) {
        var c=names.substring(i,i+1);
        OM[c]=v(c);
    }
    function isVar(o) {
        return o && o[VAR];
    }
    OM.match=function (obj, tmpl) {
        var res={};
        if (m(obj,tmpl,res)) return res;
        return null;
    };
    function m(obj, tmpl, res) {
        if (obj===tmpl) return true;
        if (obj==null) return false;
        if (typeof obj=="string" && tmpl instanceof RegExp) {
            return obj.match(tmpl);
        }
        if (typeof tmpl=="function") {
            return tmpl(obj,res);
        }
        if (typeof tmpl=="object") {
            //if (typeof obj!="object") obj={$this:obj};
            for (var i in tmpl) {
                if (i==VAR) continue;
                var oe=(i==THIZ? obj :  obj[i] );
                var te=tmpl[i];
                if (!m(oe, te, res)) return false;
            }
            if (tmpl[VAR]) {
                res[tmpl[VAR]]=obj;
            }
            return true;
        }
        return false;
    }
    return OM;
}();
});
/*
 コード生成中に使う補助ライブラリ．自分の処理しているクラス，メソッド，変数などの情報を保持する
 使い方:
   c=context();
   c.enter({a:3, b:5}, function (c) {
       // この中では，c.a==3 ,  c.b==5
       console.log("a="+c.a+" b="+c.b);
       c.enter({b:6}, function (c) {
          // この中では，c.a==3 ,  c.b==6
          console.log("a="+c.a+" b="+c.b);
       });
       // c.a==3 ,  c.b==5  に戻る
       console.log("a="+c.a+" b="+c.b);

   });
 */
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('context',[],function () {
return context=function () {
    var c={};
    c.ovrFunc=function (from , to) {
        to.parent=from;
        return to;
    };
    c.enter=enter;
    return c;
    function enter(val, act) {
        var sv={};
        for (var k in val) {
            if (k.match(/^\$/)) {
                k=RegExp.rightContext;
                sv[k]=c[k];
                c[k]=c.ovrFunc(c[k], val[k]);
            } else {
                sv[k]=c[k];
                c[k]=val[k];
            }
        }
        act(c);
        for (var k in sv) {
            c[k]=sv[k];
        }
    }
};
});
if (typeof define!=="function") {
   define=require("requirejs").define;
}
define('Visitor',[],function (){
return Visitor = function (funcs) {
	var $={funcs:funcs, path:[]};
	$.visit=function (node) {
	    try {
	        $.path.push(node);
	        if ($.debug) console.log("visit ",node.type, node.pos);
	        var v=(node ? funcs[node.type] :null);
	        if (v) return v.call($, node);
	        else if ($.def) return $.def.call($,node);
	    } finally {
	        $.path.pop();
	    }
	};
	$.replace=function (node) {
		if (!$.def) {
			$.def=function (node) {
				if (typeof node=="object"){
					for (var i in node) {
						if (node[i] && typeof node[i]=="object") {
							node[i]=$.visit(node[i]);
						}
					}
				}
				return node;
			};
		}
		return $.visit(node);
	};
	return $;
};
});
define('Tonyu.Compiler',["Tonyu","ObjectMatcher", "TError"],
        function(Tonyu,ObjectMatcher, TError) {
    var cu={};
    Tonyu.Compiler=cu;
    var ScopeTypes={
            FIELD:"field", METHOD:"method", NATIVE:"native",//B
            LOCAL:"local", THVAR:"threadvar",
            PARAM:"param", GLOBAL:"global",
            CLASS:"class"
    };
    cu.ScopeTypes=ScopeTypes;
    var symSeq=1;//B
    function genSt(st, options) {//B
        var res={type:st};
        if (options) {
            for (var k in options) res[k]=options[k];
        }
        if (!res.name) res.name=genSym("_"+st+"_");
        return res;
    }
    cu.newScopeType=genSt;
    function stype(st) {//B
        return st ? st.type : null;
    }
    cu.getScopeType=stype;
    function newScope(s) {//B
        var f=function (){};
        f.prototype=s;
        return new f();
    }
    cu.newScope=newScope;
    function nc(o, mesg) {//B
        if (!o) throw mesg+" is null";
        return o;
    }
    cu.nullCheck=nc;
    function genSym(prefix) {//B
        return prefix+((symSeq++)+"").replace(/\./g,"");
    }
    cu.genSym=genSym;
    function annotation3(aobjs, node, aobj) {//B
        if (!node._id) {
            if (!aobjs._idseq) aobjs._idseq=0;
            node._id=++aobjs._idseq;
        }
        var res=aobjs[node._id];
        if (!res) res=aobjs[node._id]={node:node};
        if (aobj) {
            for (var i in aobj) res[i]=aobj[i];
        }
        return res;
    }
    cu.annotation=annotation3;
    function getSource(srcCont,node) {//B
        return srcCont.substring(node.pos,node.pos+node.len);
    }
    cu.getSource=getSource;
    function getMethod2(klass,name) {//B
        var res=null;
        getDependingClasses(klass).forEach(function (k) {
            if (res) return;
            res=k.decls.methods[name];
        });
        return res;
    }
    cu.getMethod=getMethod2;
    function getDependingClasses(klass) {//B
        var visited={};
        var res=[];
        function loop(k) {
            if (visited[k.fullName]) return;
            visited[k.fullName]=true;
            res.push(k);
            if (k.superclass) loop(k.superclass);
            if (k.includes) k.includes.forEach(loop);
        }
        loop(klass);
        return res;
    }
    cu.getDependingClasses=getDependingClasses;
    function getParams(method) {//B
        var res=[];
        if (!method.head) return res;
        if (method.head.setter) res.push(method.head.setter.value);
        var ps=method.head.params ? method.head.params.params : null;
        if (ps && !ps.forEach) throw method+" is not array ";
        if (ps) res=res.concat(ps);
        return res;
    }
    cu.getParams=getParams;
    return cu;

});
if (typeof define!=="function") {//B
   define=require("requirejs").define;
}
define('Tonyu.Compiler.JSGenerator',["Tonyu", "Tonyu.Iterator", "TonyuLang", "ObjectMatcher", "TError", "IndentBuffer",
        "context", "Visitor","Tonyu.Compiler"],
function(Tonyu, Tonyu_iterator, TonyuLang, ObjectMatcher, TError, IndentBuffer,
        context, Visitor,cu) {
return cu.JSGenerator=(function () {
// TonyuソースファイルをJavascriptに変換する
var TH="_thread",THIZ="_this", ARGS="_arguments",FIBPRE="fiber$", FRMPC="__pc", LASTPOS="$LASTPOS",CNTV="__cnt",CNTC=100;//G
var BINDF="Tonyu.bindFunc";
var INVOKE_FUNC="Tonyu.invokeMethod";
var CALL_FUNC="Tonyu.callFunc";
var CHK_NN="Tonyu.checkNonNull";
var CLASS_HEAD="Tonyu.classes.", GLOBAL_HEAD="Tonyu.globals.";
var GET_THIS="this.isTonyuObject?this:Tonyu.not_a_tonyu_object(this)";
var USE_STRICT='"use strict";%n';
var ITER="Tonyu.iterator";
/*var ScopeTypes={FIELD:"field", METHOD:"method", NATIVE:"native",//B
        LOCAL:"local", THVAR:"threadvar", PARAM:"param", GLOBAL:"global", CLASS:"class"};*/
var ScopeTypes=cu.ScopeTypes;
//var genSt=cu.newScopeType;
var stype=cu.getScopeType;
//var newScope=cu.newScope;
//var nc=cu.nullCheck;
//var genSym=cu.genSym;
var annotation3=cu.annotation;
var getMethod2=cu.getMethod;
var getDependingClasses=cu.getDependingClasses;
var getParams=cu.getParams;

//-----------
function genJS(klass, env) {//B
    var srcFile=klass.src.tonyu; //file object  //S
    var srcCont=srcFile.text();
    function getSource(node) {
        return cu.getSource(srcCont,node);
    }
    var buf=IndentBuffer();
    var printf=buf.printf;
    var ctx=context();
    var debug=false;
    var OM=ObjectMatcher;
    var traceTbl=env.traceTbl;
    // method := fiber | function
    var decls=klass.decls;
    var fields=decls.fields,
        methods=decls.methods,
        natives=decls.natives;
    // ↑ このクラスが持つフィールド，ファイバ，関数，ネイティブ変数の集まり．親クラスの宣言は含まない
    var ST=ScopeTypes;
    var fnSeq=0;
    var diagnose=env.options.compiler.diagnose;

    function annotation(node, aobj) {//B
        return annotation3(klass.annotation,node,aobj);
    }
    function getMethod(name) {//B
        return getMethod2(klass,name);
    }
    function getClassName(klass){// should be object or short name //G
        if (typeof klass=="string") return CLASS_HEAD+(env.aliases[klass] || klass);//CFN  CLASS_HEAD+env.aliases[klass](null check)
        if (klass.builtin) return klass.fullName;// CFN klass.fullName
        return CLASS_HEAD+klass.fullName;// CFN  klass.fullName
    }
    function getClassNames(cs){//G
        var res=[];
        cs.forEach(function (c) { res.push(getClassName(c)); });
        return res;
    }
    function enterV(obj, node) {//G
        return function (buf) {
            ctx.enter(obj,function () {
                v.visit(node);
            });
        };
    }
    function varAccess(n, si, an) {//G
        var t=stype(si);
        if (t==ST.THVAR) {
            buf.printf("%s",TH);
        } else if (t==ST.FIELD) {
            buf.printf("%s.%s",THIZ, n);
        } else if (t==ST.METHOD) {
            if (an && an.noBind) {
                buf.printf("%s.%s",THIZ, n);
            } else {
                buf.printf("%s(%s,%s.%s)",BINDF, THIZ, THIZ, n);
            }
        } else if (t==ST.CLASS) {
            buf.printf("%s",getClassName(n));
        } else if (t==ST.GLOBAL) {
            buf.printf("%s%s",GLOBAL_HEAD, n);
        } else if (t==ST.PARAM || t==ST.LOCAL || t==ST.NATIVE) {
            buf.printf("%s",n);
        } else {
            console.log("Unknown scope type: ",t);
            throw new Error("Unknown scope type: "+t);
        }
        return si;
    }
    function noSurroundCompoundF(node) {//G
        return function () {
            noSurroundCompound.apply(this, [node]);
        };
    }
    function noSurroundCompound(node) {//G
        if (node.type=="compound") {
            ctx.enter({noWait:true},function () {
                buf.printf("%j%n", ["%n",node.stmts]);
               // buf.printf("%{%j%n%}", ["%n",node.stmts]);
            });
        } else {
            v.visit(node);
        }
    }
    function lastPosF(node) {//G
        return function () {
            buf.printf("%s%s=%s;//%s%n", (env.options.compiler.commentLastPos?"//":""),
                    LASTPOS, traceTbl.add(klass/*.src.tonyu*/,node.pos ), klass.fullName+":"+node.pos);
        };
    }
    var THNode={type:"THNode"};//G
    v=buf.visitor=Visitor({//G
        THNode: function (node) {
            buf.printf(TH);
        },
        dummy: function (node) {
            buf.printf("",node);
        },
        literal: function (node) {
            buf.printf("%s",node.text);
        },
        paramDecl: function (node) {
            buf.printf("%v",node.name);
        },
        paramDecls: function (node) {
            buf.printf("(%j)",[", ",node.params]);
        },
        funcDeclHead: function (node) {
            buf.printf("function %v %v",node.name, node.params);
        },
        funcDecl: function (node) {
        },
        "return": function (node) {
            if (ctx.inTry) throw TError("現実装では、tryの中にreturnは書けません",srcFile,node.pos);
            if (!ctx.noWait) {
                if (node.value) {
                    buf.printf("%s.exit(%v);return;",TH,node.value);
                } else {
                    buf.printf("%s.exit(%s);return;",TH,THIZ);
                }
            } else {
                if (ctx.threadAvail) {
                    if (node.value) {
                        buf.printf("%s.retVal=%v;return;%n",TH, node.value);
                    } else {
                        buf.printf("%s.retVal=%s;return;%n",TH, THIZ);
                    }
                } else {
                    if (node.value) {
                        buf.printf("return %v;",node.value);
                    } else {
                        buf.printf("return %s;",THIZ);
                    }

                }
            }
        },
        program: function (node) {
            genClass(node.stmts);
        },
        number: function (node) {
            buf.printf("%s", node.value );
        },
        reservedConst: function (node) {
            if (node.text=="this") {
                buf.printf("%s",THIZ);
            } else if (node.text=="arguments" && ctx.threadAvail) {
                buf.printf("%s",ARGS);
            } else if (node.text==TH) {
                buf.printf("%s", (ctx.threadAvail)?TH:"null");
            } else {
                buf.printf("%s", node.text);
            }
        },
        varDecl: function (node) {
            if (node.value) {
                buf.printf("%v = %v", node.name, node.value );
            } else {
                buf.printf("%v", node.name);
            }
        },
        varsDecl: function (node) {
            lastPosF(node)();
            buf.printf("%j;", [";",node.decls]);
        },
        jsonElem: function (node) {
            if (node.value) {
                buf.printf("%v: %v", node.key, node.value);
            } else {
                buf.printf("%v: %f", node.key, function () {
                    var si=varAccess( node.key.text, annotation(node).scopeInfo, annotation(node));
                });
            }
        },
        objlit: function (node) {
            buf.printf("{%j}", [",", node.elems]);
        },
        arylit: function (node) {
            buf.printf("[%j]", [",", node.elems]);
        },
        funcExpr: function (node) {
        	genFuncExpr(node);
        },
        parenExpr: function (node) {
            buf.printf("(%v)",node.expr);
        },
        varAccess: function (node) {
            var n=node.name.text;
            var si=varAccess(n,annotation(node).scopeInfo, annotation(node));
        },
        exprstmt: function (node) {//exprStmt
            var t={};
            lastPosF(node)();
            if (!ctx.noWait) {
                t=annotation(node).fiberCall || {};
            }
            if (t.type=="noRet") {
                buf.printf(
                        "%s.%s%s(%j);%n" +
                        "%s=%s;return;%n" +/*B*/
                        "%}case %d:%{",
                            THIZ, FIBPRE, t.N,  [", ",[THNode].concat(t.A)],
                            FRMPC, ctx.pc,
                            ctx.pc++
                );
            } else if (t.type=="ret") {
                buf.printf(
                        "%s.%s%s(%j);%n" +
                        "%s=%s;return;%n" +/*B*/
                        "%}case %d:%{"+
                        "%v%v%s.retVal;%n",
                            THIZ, FIBPRE, t.N, [", ",[THNode].concat(t.A)],
                            FRMPC, ctx.pc,
                            ctx.pc++,
                            t.L, t.O, TH
                );
            } else if (t.type=="noRetSuper") {
                var p=getClassName(klass.superclass);
                    buf.printf(
                            "%s.prototype.%s%s.apply( %s, [%j]);%n" +
                            "%s=%s;return;%n" +/*B*/
                            "%}case %d:%{",
                             p,  FIBPRE, t.S.name.text,  THIZ,  [", ",[THNode].concat(t.A)],
                                FRMPC, ctx.pc,
                                ctx.pc++
                    );
            } else if (t.type=="retSuper") {
                    buf.printf(
                            "%s.prototype.%s%s.apply( %s, [%j]);%n" +
                            "%s=%s;return;%n" +/*B*/
                            "%}case %d:%{"+
                            "%v%v%s.retVal;%n",
                                p,  FIBPRE, t.S.name.text,  THIZ, [", ",[THNode].concat(t.A)],
                                FRMPC, ctx.pc,
                                ctx.pc++,
                                t.L, t.O, TH
                    );
            } else {
                buf.printf("%v;", node.expr );
            }
        },
        infix: function (node) {
            var opn=node.op.text;
            /*if (opn=="=" || opn=="+=" || opn=="-=" || opn=="*=" ||  opn=="/=" || opn=="%=" ) {
                checkLVal(node.left);
            }*/
            if (diagnose) {
                if (opn=="+" || opn=="-" || opn=="*" ||  opn=="/" || opn=="%" ) {
                    buf.printf("%s(%v,%l)%v%s(%v,%l)", CHK_NN, node.left, getSource(node.left), node.op,
                            CHK_NN, node.right, getSource(node.right));
                    return;
                }
                if (opn=="+=" || opn=="-=" || opn=="*=" ||  opn=="/=" || opn=="%=" ) {
                    buf.printf("%v%v%s(%v,%l)", node.left, node.op,
                            CHK_NN, node.right, getSource(node.right));
                    return;
                }
            }
            buf.printf("%v%v%v", node.left, node.op, node.right);
        },
        trifixr:function (node) {
            buf.printf("%v%v%v%v%v", node.left, node.op1, node.mid, node.op2, node.right);
        },
        prefix: function (node) {
            buf.printf("%v %v", node.op, node.right);
        },
        postfix: function (node) {
            var a=annotation(node);
            if (diagnose) {
                if (a.myMethodCall) {
                    var mc=a.myMethodCall;
                    var si=mc.scopeInfo;
                    var st=stype(si);
                    if (st==ST.FIELD || st==ST.METHOD) {
                        buf.printf("%s(%s, %l, [%j], %l )", INVOKE_FUNC,THIZ, mc.name, [",",mc.args],"this");
                    } else {
                        buf.printf("%s(%v, [%j], %l)", CALL_FUNC, node.left, [",",mc.args], getSource(node.left));
                    }
                    return;
                } else if (a.othersMethodCall) {
                    var oc=a.othersMethodCall;
                    buf.printf("%s(%v, %l, [%j], %l )", INVOKE_FUNC, oc.target, oc.name, [",",oc.args],getSource(oc.target));
                    return;
                } else if (a.memberAccess) {
                    var ma=a.memberAccess;
                    buf.printf("%s(%v,%l).%s", CHK_NN, ma.target, getSource(ma.target), ma.name );
                    return;
                }
            } else if (a.myMethodCall) {
                var mc=a.myMethodCall;
                var si=mc.scopeInfo;
                var st=stype(si);
                if (st==ST.METHOD) {
                    buf.printf("%s.%s(%j)",THIZ, mc.name, [",",mc.args]);
                    return;
                }
            }
            buf.printf("%v%v", node.left, node.op);
        },
        "break": function (node) {
            if (!ctx.noWait) {
                if (ctx.inTry && ctx.exitTryOnJump) throw TError("現実装では、tryの中にbreak;は書けません",srcFile,node.pos);
                if (ctx.closestBrk) {
                    buf.printf("%s=%z; break;%n", FRMPC, ctx.closestBrk);
                } else {
                    throw TError( "break； は繰り返しの中で使います" , srcFile, node.pos);
                }
            } else {
                buf.printf("break;%n");
            }
        },
        "try": function (node) {
            var an=annotation(node);
            if (!ctx.noWait &&
                    (an.fiberCallRequired || an.hasJump || an.hasReturn)) {
                //buf.printf("/*try catch in wait mode is not yet supported*/%n");
                if (node.catches.length!=1 || node.catches[0].type!="catch") {
                    throw TError("現実装では、catch節1個のみをサポートしています",srcFile,node.pos);
                }
                var ct=node.catches[0];
                var catchPos={},finPos={};
                buf.printf("%s.enterTry(%z);%n",TH,catchPos);
                buf.printf("%f", enterV({inTry:true, exitTryOnJump:true},node.stmt) );
                buf.printf("%s.exitTry();%n",TH);
                buf.printf("%s=%z;break;%n",FRMPC,finPos);
                buf.printf("%}case %f:%{",function (){
                       buf.print(catchPos.put(ctx.pc++));
                });
                buf.printf("%s=%s.startCatch();%n",ct.name.text, TH);
                buf.printf("%s.exitTry();%n",TH);
                buf.printf("%v%n", ct.stmt);
                buf.printf("%}case %f:%{",function (){
                    buf.print(finPos.put(ctx.pc++));
                });
            } else {
                ctx.enter({noWait:true}, function () {
                    buf.printf("try {%{%f%n%}} ",
                            noSurroundCompoundF(node.stmt));
                    node.catches.forEach(v.visit);
                });
            }
        },
        "catch": function (node) {
            buf.printf("catch (%s) {%{%f%n%}}",node.name.text, noSurroundCompoundF(node.stmt));
        },
        "throw": function (node) {
            buf.printf("throw %v;%n",node.ex);
        },
        "while": function (node) {
            lastPosF(node)();
            var an=annotation(node);
            if (!ctx.noWait &&
                    (an.fiberCallRequired || an.hasReturn)) {
                var brkpos=buf.lazy();
                var pc=ctx.pc++;
                var isTrue= node.cond.type=="reservedConst" && node.cond.text=="true";
                buf.printf(
                        /*B*/
                        "%}case %d:%{" +
                        (isTrue?"%D%D%D":"if (!(%v)) { %s=%z; break; }%n") +
                        "%f%n" +
                        "%s=%s;break;%n" +
                        "%}case %f:%{",
                            pc,
                            node.cond, FRMPC, brkpos,
                            enterV({closestBrk:brkpos, exitTryOnJump:false}, node.loop),
                            FRMPC, pc,
                            function () { buf.print(brkpos.put(ctx.pc++)); }
                );
            } else {
                ctx.enter({noWait:true},function () {
                    buf.printf("while (%v) {%{%f%n%}}", node.cond, noSurroundCompoundF(node.loop));
                });
            }
        },
        "for": function (node) {
            lastPosF(node)();
            var an=annotation(node);
            if (node.inFor.type=="forin") {
                var itn=annotation(node.inFor).iterName;
                if (!ctx.noWait &&
                        (an.fiberCallRequired || an.hasReturn)) {
                    var brkpos=buf.lazy();
                    var pc=ctx.pc++;
                    buf.printf(
                            "%s=%s(%v,%s);%n"+
                            "%}case %d:%{" +
                            "if (!(%s.next())) { %s=%z; break; }%n" +
                            "%f%n" +
                            "%f%n" +
                            "%s=%s;break;%n" +
                            "%}case %f:%{",
                                itn, ITER, node.inFor.set, node.inFor.vars.length,
                                pc,
                                itn, FRMPC, brkpos,
                                getElemF(itn, node.inFor.isVar, node.inFor.vars),
                                enterV({closestBrk:brkpos, exitTryOnJump:false}, node.loop),//node.loop,
                                FRMPC, pc,
                                function (buf) { buf.print(brkpos.put(ctx.pc++)); }
                    );
                } else {
                    ctx.enter({noWait:true},function() {
                        buf.printf(
                            "%s=%s(%v,%s);%n"+
                            "while(%s.next()) {%{" +
                            "%f%n"+
                            "%f%n" +
                            "%}}",
                            itn, ITER, node.inFor.set, node.inFor.vars.length,
                            itn,
                            getElemF(itn, node.inFor.isVar, node.inFor.vars),
                            noSurroundCompoundF(node.loop)
                        );
                    });
                }
            } else {
                if (!ctx.noWait&&
                        (an.fiberCallRequired || an.hasReturn)) {
                    var brkpos=buf.lazy();
                    var pc=ctx.pc++;
                    buf.printf(
                            "%v;%n"+
                            "%}case %d:%{" +
                            "if (!(%v)) { %s=%z; break; }%n" +
                            "%f%n" +
                            "%v;%n" +
                            "%s=%s;break;%n" +
                            "%}case %f:%{",
                                node.inFor.init ,
                                pc,
                                node.inFor.cond, FRMPC, brkpos,
                                enterV({closestBrk:brkpos,exitTryOnJump:false}, node.loop),//node.loop,
                                node.inFor.next,
                                FRMPC, pc,
                                function (buf) { buf.print(brkpos.put(ctx.pc++)); }
                    );
                } else {
                    ctx.enter({noWait:true},function() {
                        buf.printf(
                            "%v%n"+
                            "while(%v) {%{" +
                               "%v%n" +
                               "%v;%n" +
                            "%}}",
                            node.inFor.init ,
                            node.inFor.cond,
                                node.loop,
                                node.inFor.next
                        );
                    });
                }
            }
            function getElemF(itn, isVar, vars) {
                return function () {
                    vars.forEach(function (v,i) {
                        buf.printf("%s=%s[%s];%n", v.text, itn, i);
                    });
                };
            }
        },
        "if": function (node) {
            lastPosF(node)();
            //buf.printf("/*FBR=%s*/",!!annotation(node).fiberCallRequired);
            var an=annotation(node);
            if (!ctx.noWait &&
                    (an.fiberCallRequired || an.hasJump || an.hasReturn)) {
                var fipos={}, elpos={};
                if (node._else) {
                    buf.printf(
                            "if (!(%v)) { %s=%z; break; }%n" +
                            "%v%n" +
                            "%s=%z;break;%n" +
                            "%}case %f:%{" +
                            "%v%n" +
                            /*B*/
                            "%}case %f:%{"   ,
                                node.cond, FRMPC, elpos,
                                node.then,
                                FRMPC, fipos,
                                function () { buf.print(elpos.put(ctx.pc++)); },
                                node._else,

                                function () { buf.print(fipos.put(ctx.pc++)); }
                    );

                } else {
                    buf.printf(
                            "if (!(%v)) { %s=%z; break; }%n" +
                            "%v%n" +
                            /*B*/
                            "%}case %f:%{",
                                node.cond, FRMPC, fipos,
                                node.then,

                                function () { buf.print(fipos.put(ctx.pc++)); }
                    );
                }
            } else {
                ctx.enter({noWait:true}, function () {
                    if (node._else) {
                        buf.printf("if (%v) {%{%f%n%}} else {%{%f%n%}}", node.cond,
                                noSurroundCompoundF(node.then),
                                noSurroundCompoundF(node._else));
                    } else {
                        buf.printf("if (%v) {%{%f%n%}}", node.cond,
                                noSurroundCompoundF(node.then));
                    }
                });
            }
        },
        ifWait: function (node) {
            if (!ctx.noWait) {
                buf.printf("%v",node.then);
            } else {
                if (node._else) {
                    buf.printf("%v",node._else);
                }
            }
        },
        call: function (node) {
        	buf.printf("(%j)", [",",node.args]);
        },
        objlitArg: function (node) {
            buf.printf("%v",node.obj);
        },
        argList: function (node) {
            buf.printf("%j",[",",node.args]);
        },
        newExpr: function (node) {
            var p=node.params;
            if (p) {
                buf.printf("new %v%v",node.klass,p);
            } else {
                buf.printf("new %v",node.klass);
            }
        },
        scall: function (node) {
        	buf.printf("[%j]", [",",node.args]);
        },
        superExpr: function (node) {
            var name;
            if (!klass.superclass) throw new Error(klass.fullName+"には親クラスがありません");
            if (node.name) {
                name=node.name.text;
                buf.printf("%s.prototype.%s.apply( %s, %v)",
                        getClassName(klass.superclass),  name, THIZ, node.params);
            } else {
                buf.printf("%s.apply( %s, %v)",
                        getClassName(klass.superclass), THIZ, node.params);
            }
        },
        arrayElem: function (node) {
            buf.printf("[%v]",node.subscript);
        },
        member: function (node) {
            buf.printf(".%v",node.name);
        },
        symbol: function (node) {
            buf.print(node.text);
        },
        "normalFor": function (node) {
            buf.printf("%v; %v; %v", node.init, node.cond, node.next);
        },
        compound: function (node) {
            var an=annotation(node);
            if (!ctx.noWait &&
                    (an.fiberCallRequired || an.hasJump || an.hasReturn) ) {
                buf.printf("%j", ["%n",node.stmts]);
            } else {
                /*if (ctx.noSurroundBrace) {
                    ctx.enter({noSurroundBrace:false,noWait:true},function () {
                        buf.printf("%{%j%n%}", ["%n",node.stmts]);
                    });
                } else {*/
                    ctx.enter({noWait:true},function () {
                        buf.printf("{%{%j%n%}}", ["%n",node.stmts]);
                    });
                //}
            }
        },
	"typeof": function (node) {
	    buf.printf("typeof ");
	},
	"instanceof": function (node) {
	    buf.printf(" instanceof ");
	},
    "is": function (node) {
        buf.printf(" instanceof ");
    },
	regex: function (node) {
	    buf.printf("%s",node.text);
	}
    });
    var opTokens=["++", "--", "!==", "===", "+=", "-=", "*=", "/=",
		  "%=", ">=", "<=",
    "!=", "==", ">>", "<<", "&&", "||", ">", "<", "+", "?", "=", "*",
    "%", "/", "^", "~", "\\", ":", ";", ",", "!", "&", "|", "-"
	,"delete"	 ];
    opTokens.forEach(function (opt) {
	v.funcs[opt]=function (node) {
	    buf.printf("%s",opt);
	};
    });
    //v.debug=debug;
    v.def=function (node) {
        console.log("Err node=");
        console.log(node);
        throw node.type+" is not defined in visitor:compiler2";
    };
    v.cnt=0;
    function genSource() {//G
        /*if (env.options.compiler.asModule) {
            klass.moduleName=getClassName(klass);
            printf("if (typeof requireSimulator=='object') requireSimulator.setName(%l);%n",klass.moduleName);
            printf("//requirejs(['Tonyu'%f],function (Tonyu) {%{", function (){
                getDependingClasses(klass).forEach(function (k) {
                    printf(",%l",k.moduleName);
                });
            });
        }*/
        ctx.enter({}, function () {
            /*var nspObj=CLASS_HEAD+klass.namespace;
            printf("Tonyu.klass.ensureNamespace(%s,%l);%n",CLASS_HEAD.replace(/\.$/,""), klass.namespace);
            if (klass.superclass) {
                printf("%s=Tonyu.klass(%s,[%s],{%{",
                        getClassName(klass),
                        getClassName(klass.superclass),
                        getClassNames(klass.includes).join(","));
            } else {
                printf("%s=Tonyu.klass([%s],{%{",
                        getClassName(klass),
                        getClassNames(klass.includes).join(","));
            }*/
            printf("Tonyu.klass.define({%{");
            printf("fullName: %l,%n", klass.fullName);
            printf("shortName: %l,%n", klass.shortName);
            printf("namespace: %l,%n", klass.namespace);
            if (klass.superclass) printf("superclass: %s,%n", getClassName(klass.superclass));
            printf("includes: [%s],%n", getClassNames(klass.includes).join(","));
            printf("methods: {%{");
            for (var name in methods) {
                if (debug) console.log("method1", name);
                var method=methods[name];
                ctx.enter({noWait:true, threadAvail:false}, function () {
                    genFunc(method);
                });
                if (debug) console.log("method2", name);
                if (!method.nowait ) {
                    ctx.enter({noWait:false,threadAvail:true}, function () {
                        genFiber(method);
                    });
                }
                if (debug) console.log("method3", name);
            }
            printf("__dummy: false%n");
            printf("%}},%n");
            printf("decls: %s%n", JSON.stringify(digestDecls(klass)));
            printf("%}});");
            //printf("%}});%n");
        });
        //printf("Tonyu.klass.addMeta(%s,%s);%n",
        //        getClassName(klass),JSON.stringify(digestMeta(klass)));
        //if (env.options.compiler.asModule) {
        //    printf("//%}});");
        //}
    }
    function digestDecls(klass) {
        var res={methods:{}};
        for (var i in klass.decls.methods) {
            res.methods[i]=
            {nowait:!!klass.decls.methods[i].nowait};
        }
        return res;
    }
    function digestMeta(klass) {//G
        var res={
                fullName: klass.fullName,
                namespace: klass.namespace,
                shortName: klass.shortName,
                decls:{methods:{}}
        };
        for (var i in klass.decls.methods) {
            res.decls.methods[i]=
            {nowait:!!klass.decls.methods[i].nowait};
        }
        return res;
    }
    function genFiber(fiber) {//G
        if (isConstructor(fiber)) return;
        var stmts=fiber.stmts;
        var noWaitStmts=[], waitStmts=[], curStmts=noWaitStmts;
        var opt=true;
        if (opt) {
            stmts.forEach(function (s) {
                if (annotation(s).fiberCallRequired) {
                    curStmts=waitStmts;
                }
                curStmts.push(s);
            });
        } else {
            waitStmts=stmts;
        }
        printf(
               "%s%s :function %s(%j) {%{"+
                 USE_STRICT+
                 "var %s=%s;%n"+
                 "%svar %s=%s;%n"+
                 "var %s=0;%n"+
                 "%f%n"+
                 "%f%n",
               FIBPRE, fiber.name, genFn(fiber.pos,"f_"+fiber.name), [",",[THNode].concat(fiber.params)],
                 THIZ, GET_THIS,
                 (fiber.useArgs?"":"//"), ARGS, "Tonyu.A(arguments)",
                 FRMPC,
                 genLocalsF(fiber),
                 nfbody
        );
        if (waitStmts.length>0) {
            printf(
                 "%s.enter(function %s(%s) {%{"+
                    "if (%s.lastEx) %s=%s.catchPC;%n"+
                    "for(var %s=%d ; %s--;) {%{"+
                      "switch (%s) {%{"+
                        "%}case 0:%{"+
                        "%f" +
                        "%s.exit(%s);return;%n"+
                      "%}}%n"+
                    "%}}%n"+
                 "%}});%n",
                 TH,genFn(fiber.pos,"ent_"+fiber.name),TH,
                    TH,FRMPC,TH,
                    CNTV, CNTC, CNTV,
                      FRMPC,
                        // case 0:
                        fbody,
                        TH,THIZ
            );
        } else {
            printf("%s.retVal=%s;return;%n",TH,THIZ);
        }
        printf("%}},%n");
        function nfbody() {
            ctx.enter({method:fiber, /*scope: fiber.scope,*/ noWait:true, threadAvail:true }, function () {
                noWaitStmts.forEach(function (stmt) {
                    printf("%v%n", stmt);
                });
            });
        }
        function fbody() {
            ctx.enter({method:fiber, /*scope: fiber.scope,*/
                finfo:fiber, pc:1}, function () {
                waitStmts.forEach(function (stmt) {
                    printf("%v%n", stmt);
                });
            });
        }
    }
    function genFunc(func) {//G
        var fname= isConstructor(func) ? "initialize" : func.name;
        printf("%s :function %s(%j) {%{"+
                  USE_STRICT+
                  "var %s=%s;%n"+
                  "%f%n" +
                  "%f" +
               "%}},%n",
               fname, genFn(func.pos,fname), [",",func.params],
               THIZ, GET_THIS,
               	      genLocalsF(func),
                      fbody
        );
        function fbody() {
            ctx.enter({method:func, finfo:func,
                /*scope: func.scope*/ }, function () {
                func.stmts.forEach(function (stmt) {
                    printf("%v%n", stmt);
                });
            });
        }
    }
    function genFuncExpr(node) {//G
        var finfo=annotation(node);// annotateSubFuncExpr(node);

        buf.printf("(function %s(%j) {%{"+
                       "%f%n"+
                       "%f"+
                   "%}})"
                 ,
                    finfo.name, [",", finfo.params],
                 	genLocalsF(finfo),
                       fbody
        );
        function fbody() {
            ctx.enter({noWait: true, threadAvail:false,
                finfo:finfo, /*scope: finfo.scope*/ }, function () {
                node.body.stmts.forEach(function (stmt) {
                    printf("%v%n", stmt);
                });
            });
        }
    }
    function genFn(pos,name) {//G
        if (!name) name=(fnSeq++)+"";
        return ("_trc_"+klass.shortName+"_"+name)
//        return ("_trc_func_"+traceTbl.add(klass,pos )+"_"+(fnSeq++));//  Math.random()).replace(/\./g,"");
    }
    function genSubFunc(node) {//G
        var finfo=annotation(node);// annotateSubFuncExpr(node);
        buf.printf("function %s(%j) {%{"+
                      "%f%n"+
                      "%f"+
                   "%}}"
                 ,
                     finfo.name,[",", finfo.params],
                  	genLocalsF(finfo),
                       fbody
        );
        function fbody() {
            ctx.enter({noWait: true, threadAvail:false,
                finfo:finfo, /*scope: finfo.scope*/ }, function () {
                node.body.stmts.forEach(function (stmt) {
                    printf("%v%n", stmt);
                });
            });
        }
    }
    function genLocalsF(finfo) {//G
        return f;
        function f() {
            ctx.enter({/*scope:finfo.scope*/}, function (){
                for (var i in finfo.locals.varDecls) {
                    buf.printf("var %s;%n",i);
                }
                for (var i in finfo.locals.subFuncDecls) {
                    genSubFunc(finfo.locals.subFuncDecls[i]);
                }
            });
        };
    }
    function isConstructor(f) {//G
        return OM.match(f, {ftype:"constructor"}) || OM.match(f, {name:"new"});
    }
    genSource();//G
    klass.src.js=buf.buf;//G
    if (debug) {
        console.log("method4", buf.buf);
        //throw "ERR";
    }
    return buf.buf;
}//B
return {genJS:genJS};
})();
//if (typeof getReq=="function") getReq.exports("Tonyu.Compiler");
});
if (typeof define!=="function") {//B
   define=require("requirejs").define;
}
define('Tonyu.Compiler.Semantics',["Tonyu", "Tonyu.Iterator", "TonyuLang", "ObjectMatcher", "TError", "IndentBuffer",
        "context", "Visitor","Tonyu.Compiler"],
function(Tonyu, Tonyu_iterator, TonyuLang, ObjectMatcher, TError, IndentBuffer,
        context, Visitor,cu) {
return cu.Semantics=(function () {
/*var ScopeTypes={FIELD:"field", METHOD:"method", NATIVE:"native",//B
        LOCAL:"local", THVAR:"threadvar", PARAM:"param", GLOBAL:"global", CLASS:"class"};*/
var ScopeTypes=cu.ScopeTypes;
var genSt=cu.newScopeType;
var stype=cu.getScopeType;
var newScope=cu.newScope;
//var nc=cu.nullCheck;
var genSym=cu.genSym;
var annotation3=cu.annotation;
var getMethod2=cu.getMethod;
var getDependingClasses=cu.getDependingClasses;
var getParams=cu.getParams;
var JSNATIVES={Array:1, String:1, Boolean:1, Number:1, Void:1, Object:1,RegExp:1,Error:1};
//-----------
function initClassDecls(klass, env ) {//S
    var s=klass.src.tonyu; //file object
    var node=TonyuLang.parse(s);
    var MAIN={name:"main",stmts:[],pos:0};
    // method := fiber | function
    var fields={}, methods={main: MAIN}, natives={};
    klass.decls={fields:fields, methods:methods, natives: natives};
    klass.node=node;
    /*function nc(o, mesg) {
        if (!o) throw mesg+" is null";
        return o;
    }*/
    var OM=ObjectMatcher;
    function initMethods(program) {
        var spcn=env.options.compiler.defaultSuperClass;
        var pos=0;
        var t;
        if (t=OM.match( program , {ext:{superclassName:{text:OM.N, pos:OM.P}}})) {
            spcn=t.N;
            pos=t.P;
            if (spcn=="null") spcn=null;
        }
        klass.includes=[];
        if (t=OM.match( program , {incl:{includeClassNames:OM.C}})) {
            t.C.forEach(function (i) {
                var n=i.text;/*ENVC*/
                var p=i.pos;
                var incc=env.classes[env.aliases[n] || n];/*ENVC*/ //CFN env.classes[env.aliases[n]]
                if (!incc) throw TError ( "クラス "+n+"は定義されていません", s, p);
                klass.includes.push(incc);
            });
        }
        if (spcn=="Array") {
            klass.superclass={name:"Array",fullName:"Array",builtin:true};
        } else if (spcn) {
            var spc=env.classes[env.aliases[spcn] || spcn];/*ENVC*/  //CFN env.classes[env.aliases[spcn]]
            if (!spc) {
                throw TError ( "親クラス "+spcn+"は定義されていません", s, pos);
            }
            klass.superclass=spc;
        }
        program.stmts.forEach(function (stmt) {
            if (stmt.type=="funcDecl") {
                var head=stmt.head;
                var ftype="function";
                if (head.ftype) {
                    ftype=head.ftype.text;
                    //console.log("head.ftype:",stmt);
                }
                var name=head.name.text;
                var propHead=(head.params ? "" : head.setter ? "__setter__" : "__getter__");
                name=propHead+name;

                methods[name]={
                        nowait: (!!head.nowait || propHead!=""),
                        ftype:  ftype,
                        name:  name,
                        head:  head,
                        pos: head.pos,
                        stmts: stmt.body.stmts
                };
            } else if (stmt.type=="nativeDecl") {
                natives[stmt.name.text]=stmt;
            } else {
                MAIN.stmts.push(stmt);
            }
        });
    }
    initMethods(node);        // node=program
}
function annotateSource2(klass, env) {//B
    var srcFile=klass.src.tonyu; //file object  //S
    var srcCont=srcFile.text();
    function getSource(node) {
        return cu.getSource(srcCont,node);
    }
    var OM=ObjectMatcher;
    var traceTbl=env.traceTbl;
    // method := fiber | function
    var decls=klass.decls;
    var fields=decls.fields,
        methods=decls.methods,
        natives=decls.natives;
    // ↑ このクラスが持つフィールド，ファイバ，関数，ネイティブ変数の集まり．親クラスの宣言は含まない
    var ST=ScopeTypes;
    var topLevelScope={};
    // ↑ このソースコードのトップレベル変数の種類 ，親クラスの宣言を含む
    //  キー： 変数名   値： ScopeTypesのいずれか
    var v=null;
    var ctx=context();
    var debug=false;
    var othersMethodCallTmpl={
            type:"postfix",
            left:{
                type:"postfix",
                left:OM.T,
                op:{type:"member",name:{text:OM.N}}
            },
            op:{type:"call", args:OM.A }
    };
    var memberAccessTmpl={
            type:"postfix",
            left: OM.T,
            op:{type:"member",name:{text:OM.N}}
    };
    var myMethodCallTmpl=fiberCallTmpl={
            type:"postfix",
            left:{type:"varAccess", name: {text:OM.N}},
            op:{type:"call", args:OM.A }
    };
    var noRetFiberCallTmpl={
        expr: fiberCallTmpl
    };
    var retFiberCallTmpl={
        expr: {
            type: "infix",
            op: OM.O,
            left: OM.L,
            right: fiberCallTmpl
        }
    };
    var noRetSuperFiberCallTmpl={
        expr: {type:"superExpr", params:{args:OM.A}, $var:"S"}
    };
    var retSuperFiberCallTmpl={
            expr: {
                type: "infix",
                op: OM.O,
                left: OM.L,
                right: {type:"superExpr", params:{args:OM.A}, $var:"S"}
            }
        };
    klass.annotation={};
    function annotation(node, aobj) {//B
        return annotation3(klass.annotation,node,aobj);
    }
    /*function assertAnnotated(node, si) {//B
        var a=annotation(node);
        if (!a.scopeInfo) {
            console.log(srcCont.substring(node.pos-5,node.pos+20));
            console.log(node, si);
            throw "Scope info not set";
        }
        if (si.type!=a.scopeInfo.type){
            console.log(srcCont.substring(node.pos-5,node.pos+20));
            console.log(node, si , a.scopeInfo);
            throw "Scope info not match";
        }
    }*/
    function initTopLevelScope2(klass) {//S
    	if (klass.builtin) return;
        var s=topLevelScope;
        var decls=klass.decls;
        for (var i in decls.fields) {
            s[i]=genSt(ST.FIELD,{klass:klass.name,name:i});
        }
        for (var i in decls.methods) {
            s[i]=genSt(ST.METHOD,{klass:klass.name, name:i});
        }
    }
    function initTopLevelScope() {//S
        var s=topLevelScope;
        getDependingClasses(klass).forEach(initTopLevelScope2);
        var decls=klass.decls;// Do not inherit parents' natives
        for (var i in decls.natives) {
            s[i]=genSt(ST.NATIVE,{name:"native::"+i});
        }
        for (var i in JSNATIVES) {
            s[i]=genSt(ST.NATIVE,{name:"native::"+i});
        }
        for (var i in env.aliases) {/*ENVC*/ //CFN  env.classes->env.aliases
            s[i]=genSt(ST.CLASS,{name:i});
        }
    }
    function inheritSuperMethod() {//S
        var d=getDependingClasses(klass);
        for (var n in klass.decls.methods) {
            var m2=klass.decls.methods[n];
            d.forEach(function (k) {
                var m=k.decls.methods[n];
                if (m && m.nowait) {
                    m2.nowait=true;
                }
            });
        }
    }
    function getMethod(name) {//B
        return getMethod2(klass,name);
    }
    function checkLVal(node) {//S
        if (node.type=="varAccess" ||
                node.type=="postfix" && (node.op.type=="member" || node.op.type=="arrayElem") ) {
            if (node.type=="varAccess") {
                annotation(node,{noBind:true});
            }
            return true;
        }
        console.log("LVal",node);
        throw TError( "'"+getSource(node)+"'は左辺には書けません．" , srcFile, node.pos);
    }
    function getScopeInfo(n) {//S
        var si=ctx.scope[n];
        var t=stype(si);
        if (!t) {
            var isg=n.match(/^\$/);
            t=isg?ST.GLOBAL:ST.FIELD;
            var opt={name:n};
            if (!isg) opt.klass=klass.name;
            si=topLevelScope[n]=genSt(t,opt);
        }
        return si;
    }
    var localsCollector=Visitor({
        varDecl: function (node) {
            ctx.locals.varDecls[node.name.text]=node;
        },
        funcDecl: function (node) {/*FDITSELFIGNORE*/
            ctx.locals.subFuncDecls[node.head.name.text]=node;
            //initParamsLocals(node);??
        },
        funcExpr: function (node) {/*FEIGNORE*/
            //initParamsLocals(node);??
        },
        "catch": function (node) {
            ctx.locals.varDecls[node.name.text]=node;
        },
        exprstmt: function (node) {
        },
        "forin": function (node) {
            var isVar=node.isVar;
            node.vars.forEach(function (v) {
                /* if (isVar) */ctx.locals.varDecls[v.text]=node;
            });
            var n=genSym("_it_");
            annotation(node, {iterName:n});
            ctx.locals.varDecls[n]=node;// ??
        }
    });
    localsCollector.def=visitSub;//S
    function visitSub(node) {//S
        var t=this;
        if (!node || typeof node!="object") return;
        var es;
        if (node instanceof Array) es=node;
        else es=node[Grammar.SUBELEMENTS];
        if (!es) {
            es=[];
            for (var i in node) {
                es.push(node[i]);
            }
        }
        es.forEach(function (e) {
            t.visit(e);
        });
    }
    function collectLocals(node) {//S
        var locals={varDecls:{}, subFuncDecls:{}};
        ctx.enter({locals:locals},function () {
            localsCollector.visit(node);
        });
        return locals;
    }
    function annotateParents(path, data) {//S
        path.forEach(function (n) {
            annotation(n,data);
        });
    }
    function fiberCallRequired(path) {//S
        if (ctx.method) ctx.method.fiberCallRequired=true;
        annotateParents(path, {fiberCallRequired:true} );
    }
    var varAccessesAnnotator=Visitor({//S
        varAccess: function (node) {
            var si=getScopeInfo(node.name.text);
            annotation(node,{scopeInfo:si});
        },
        funcDecl: function (node) {/*FDITSELFIGNORE*/
        },
        funcExpr: function (node) {/*FEIGNORE*/
            annotateSubFuncExpr(node);
        },
        jsonElem: function (node) {
            if (node.value) {
                this.visit(node.value);
            } else {
                var si=getScopeInfo(node.key.text);
                annotation(node,{scopeInfo:si});
            }
        },
        "do": function (node) {
            var t=this;
            ctx.enter({jumpable:true}, function () {
                t.def(node);
            });
        },
        "switch": function (node) {
            var t=this;
            ctx.enter({jumpable:true}, function () {
                t.def(node);
            });
        },
        "while": function (node) {
            var t=this;
            ctx.enter({jumpable:true}, function () {
                t.def(node);
            });
            fiberCallRequired(this.path);//option
        },
        "for": function (node) {
            var t=this;
            ctx.enter({jumpable:true}, function () {
                t.def(node);
            });
        },
        "forin": function (node) {
            node.vars.forEach(function (v) {
                var si=getScopeInfo(v.text);
                annotation(v,{scopeInfo:si});
            });
            this.visit(node.set);
        },
        ifWait: function (node) {
            var TH="_thread";
            var t=this;
            var ns=newScope(ctx.scope);
            ns[TH]=genSt(ST.THVAR);
            ctx.enter({scope:ns}, function () {
                t.visit(node.then);
            });
            if (node._else) {
                t.visit(node._else);
            }
            fiberCallRequired(this.path);
        },
        "try": function (node) {
            ctx.finfo.useTry=true;
            this.def(node);
        },
        "return": function (node) {
            if (!ctx.noWait) annotateParents(this.path,{hasReturn:true});
            this.visit(node.value);
        },
        "break": function (node) {
            if (!ctx.jumpable) throw TError( "break； は繰り返しの中で使います." , srcFile, node.pos);
            if (!ctx.noWait) annotateParents(this.path,{hasJump:true});
        },
        "continue": function (node) {
            if (!ctx.jumpable) throw TError( "continue； は繰り返しの中で使います." , srcFile, node.pos);
            if (!ctx.noWait) annotateParents(this.path,{hasJump:true});
        },
        "reservedConst": function (node) {
            if (node.text=="arguments") {
                ctx.finfo.useArgs=true;
            }
        },
        postfix: function (node) {
            var t;
            this.visit(node.left);
            this.visit(node.op);
            if (t=OM.match(node, myMethodCallTmpl)) {
                var si=annotation(node.left).scopeInfo;
                annotation(node, {myMethodCall:{name:t.N,args:t.A,scopeInfo:si}});
            } else if (t=OM.match(node, othersMethodCallTmpl)) {
                annotation(node, {othersMethodCall:{target:t.T,name:t.N,args:t.A} });
            } else if (t=OM.match(node, memberAccessTmpl)) {
                annotation(node, {memberAccess:{target:t.T,name:t.N} });
            }
        },
        infix: function (node) {
            var opn=node.op.text;
            if (opn=="=" || opn=="+=" || opn=="-=" || opn=="*=" ||  opn=="/=" || opn=="%=" ) {
                checkLVal(node.left);
            }
            this.def(node);
        },
        exprstmt: function (node) {
            var t,m;
            if (!ctx.noWait &&
                    (t=OM.match(node,noRetFiberCallTmpl)) &&
                    stype(ctx.scope[t.N])==ST.METHOD &&
                    !getMethod(t.N).nowait) {
                t.type="noRet";
                annotation(node, {fiberCall:t});
                fiberCallRequired(this.path);
            } else if (!ctx.noWait &&
                    (t=OM.match(node,retFiberCallTmpl)) &&
                    stype(ctx.scope[t.N])==ST.METHOD &&
                    !getMethod(t.N).nowait) {
                t.type="ret";
                annotation(node, {fiberCall:t});
                fiberCallRequired(this.path);
            } else if (!ctx.noWait &&
                    (t=OM.match(node,noRetSuperFiberCallTmpl)) &&
                    t.S.name) {
                m=getMethod(t.S.name.text);
                if (!m) throw new Error("メソッド"+t.S.name.text+" はありません。");
                if (!m.nowait) {
                    t.type="noRetSuper";
                    t.superclass=klass.superclass;
                    annotation(node, {fiberCall:t});
                    fiberCallRequired(this.path);
                }
            } else if (!ctx.noWait &&
                    (t=OM.match(node,retSuperFiberCallTmpl)) &&
                    t.S.name) {
                m=getMethod(t.S.name.text);
                if (!m) throw new Error("メソッド"+t.S.name.text+" はありません。");
                if (!m.nowait) {
                    t.type="retSuper";
                    t.superclass=klass.superclass;
                    annotation(node, {fiberCall:t});
                    fiberCallRequired(this.path);
                }
            }
            this.visit(node.expr);
        }
    });
    varAccessesAnnotator.def=visitSub;//S
    function annotateVarAccesses(node,scope) {//S
        ctx.enter({scope:scope}, function () {
            varAccessesAnnotator.visit(node);
        });
    }
    function copyLocals(locals, scope) {//S
        for (var i in locals.varDecls) {
            scope[i]=genSt(ST.LOCAL);
        }
        for (var i in locals.subFuncDecls) {
            scope[i]=genSt(ST.LOCAL);
        }
    }
    function initParamsLocals(f) {//S
        f.locals=collectLocals(f.stmts);
        f.params=getParams(f);
    }
    function annotateMethodFiber(f) {//S
        var ns=newScope(ctx.scope);
        f.params.forEach(function (p,cnt) {
            ns[p.name.text]=genSt(ST.PARAM,{
                klass:klass.name, name:f.name, no:cnt
            });
        });
        copyLocals(f.locals, ns);
        ctx.enter({method:f,finfo:f, noWait:false}, function () {
            annotateVarAccesses(f.stmts, ns);
        });
        f.scope=ns;
        annotateSubFuncExprs(f.locals, ns);
        return ns;
    }
    function annotateSource() {//S
        ctx.enter({scope:topLevelScope}, function () {
            for (var name in methods) {
                if (debug) console.log("anon method1", name);
                var method=methods[name];
                initParamsLocals(method);
                annotateMethodFiber(method);
            }
        });
    }
    function annotateSubFuncExpr(node) {// annotateSubFunc or FuncExpr
        var m,ps;
        var body=node.body;
        var name=(node.head.name ? node.head.name.text : "anonymous_"+node.pos );
        if (m=OM.match( node, {head:{params:{params:OM.P}}})) {
            ps=m.P;
        } else {
            ps=[];
        }
        var ns=newScope(ctx.scope);
        ps.forEach(function (p) {
            ns[p.name.text]=genSt(ST.PARAM);
        });
        var locals=collectLocals(body, ns);
        copyLocals(locals,ns);
        var finfo=annotation(node);
        ctx.enter({finfo: finfo}, function () {
            annotateVarAccesses(body,ns);
        });
        var res={scope:ns, locals:locals, name:name, params:ps};
        annotation(node,res);
        annotation(node,finfo);
        annotateSubFuncExprs(locals, ns);
        return res;
    }
    function annotateSubFuncExprs(locals, scope) {//S
        ctx.enter({scope:scope}, function () {
            for (var n in locals.subFuncDecls) {
                annotateSubFuncExpr(locals.subFuncDecls[n]);
            }
        });
    }
    initTopLevelScope();//S
    inheritSuperMethod();//S
    annotateSource();
}//B
return {initClassDecls:initClassDecls, annotate:annotateSource2};
})();
//if (typeof getReq=="function") getReq.exports("Tonyu.Compiler");
});
define('StackTrace',[],function (){
    var trc={};
    var pat=/(_trc_[A-Za-z0-9_]*).*[^0-9]([0-9]+):([0-9]+)[\s\)]*\r?$/;
    trc.isAvailable=function () {
        var scr=
            "({\n"+
            "    main :function _trc_func_17000000_0() {\n"+
            "      var a=(this.t.x);\n"+
            "    }\n"+
            "}).main();\n";
        var s;
        try {
            eval(scr);
        } catch (e) {
            s=e.stack;
            if (typeof s!="string") return false;
            var lines=s.split(/\n/);
            for (var i=0 ; i<lines.length; i++) {
                var p=pat.exec(lines[i]);
                if (p) return true;
            }
        }
        return false;
    };
    trc.get=function (e) {
        var s=e.stack;
        if (typeof s!="string") return false;
        var lines=s.split(/\n/);
        var res=[];
        for (var i=0 ; i<lines.length; i++) {
            var p=pat.exec(lines[i]);
            if (!p) continue;
            //var id=p[1];
            var fname=p[1];
            var row=p[2];
            var col=p[3];
            res.push({fname:fname, row:row,col:col});
            //var tri=ttb.decode(id);
            /*if (tri && tri.klass) {
                var str=tri.klass.src.js;
                var slines=str.split(/\n/);
                var sid=null;
                for (var j=0 ; j<slines.length && j+1<row ; j++) {
                    var lp=/\$LASTPOS=([0-9]+)/.exec(slines[j]);
                    if (lp) sid=parseInt(lp[1]);
                }
                //console.log("slines,row,sid",slines,row,sid);
                if (sid) {
                    var stri=ttb.decode(sid);
                    if (stri) res.push(stri);
                }
            }*/
        }
        /*$lastStackTrace=res;
        $showLastStackTrace=function () {
            console.log("StackTrace.get",res);
            //console.log("StackTrace.get",lines,res);
        };*/
        console.log("StackTrace.get",res);
        return res;
    };


    return trc;
});
define('Tonyu.TraceTbl',["Tonyu", "FS", "TError","StackTrace"],
function(Tonyu, FS, TError,trc) {
return Tonyu.TraceTbl=(function () {
    var TTB={};
    var POSMAX=1000000;
    var pathIdSeq=1;
    var PATHIDMAX=10000;
    var path2Id={}, id2Path=[];
    var path2Class={};
    TTB.add=function (klass, pos){
        var file=klass.src.tonyu;
        var path=file.path();
        var pathId=path2Id[path];
        if (pathId==undefined) {
            pathId=pathIdSeq++;
            if (pathIdSeq>PATHIDMAX) pathIdSeq=0;
            path2Id[path]=pathId;
            id2Path[pathId]=path;
        }
        path2Class[path]=klass;
        if (pos>=POSMAX) pos=POSMAX-1;
        var id=pathId*POSMAX+pos;
        return id;
    };
    var srcMap={};
    TTB.decodeOLD=function (id) {
        var pos=id%POSMAX;
        var pathId=(id-pos)/POSMAX;
        var path=id2Path[pathId];
        if (path) {
            var f=FS.get(path);
            var klass=path2Class[path];
            return TError("Trace info", klass || f, pos);
        } else {
            return null;
            //return TError("Trace info", "unknown src id="+id, pos);
        }
    };
    TTB.srcMap=srcMap;
    TTB.decode=function (id) {
        var pat=new RegExp("LASTPOS="+id+";//(.*)\r?\n");
        console.log("pat=",pat);
        for (var k in srcMap) {
            var r=pat.exec( srcMap[k] );
            if (r) {
                // user.Main:335
                //alert(r[1]);
                return r[1];
            } else {
                console.log("pat=",pat,"Not found in ",k);

            }
        }
    };
    TTB.find=function (e) {
        var trcs=trc.get(e);
        var trc1=trcs[0];
        if (!trc1) return null;
        var pat=new RegExp("LASTPOS=[0-9]+;//(.*)\r?");
        for (var k in srcMap) {
            console.log("Finding ", trc1.fname, " in ",k);
            var r=srcMap[k].indexOf(trc1.fname);
            if (r>=0) {
                console.log("fname found at ",r);
                var slines=srcMap[k].split(/\n/);
                var sid=null;
                var row=trc1.row-1;
                console.log("Scan from row=",row);
                for (var j=row ; j>=0 ; j--) {
                    console.log("row ",j, slines[j]);
                    if (slines[j]==null) break;
                    var lp=pat.exec(slines[j]);
                    if (lp) return lp[1];
                }
                console.log("Not found LASTPOS pat");
            } else {
                console.log("Not found in ",k);
            }
        }
    };

    TTB.addSource=function (key,src) {
        srcMap[key]=src;
    };
    return TTB;
})();
//if (typeof getReq=="function") getReq.exports("Tonyu.TraceTbl");
});
define('DeferredUtil',[], function () {
    var DU;
    DU={
            directPromise:function (v) {
                var d=new $.Deferred;
                setTimeout(function () {d.resolve(v);},0);
                return d.promise();
            },
            throwPromise:function (e) {
                d=new $.Deferred;
                setTimeout(function () {
                    d.reject(e);
                }, 0);
                return d.promise();
            },
            throwF: function (f) {
                return function () {
                    try {
                        return f.apply(this,arguments);
                    } catch(e) {
                        return DU.throwPromise(e);
                    }
                };
            }
    };
    return DU;
});
define('compiledProject',[], function () {
    var CPR=function (ns, url) {
        return {
            getNamespace:function () {return ns;},
            sourceDir: function () {return null;},
            getDependingProjects: function () {return [];},
            loadClasses: function (ctx) {
                console.log("Load compiled classes ns=",ns,"url=",url);
                var d=new $.Deferred;
                var head = document.getElementsByTagName("head")[0] || document.documentElement;
                var script = document.createElement("script");
                script.src = url;
                var done = false;
                script.onload = script.onreadystatechange = function() {
                    if ( !done && (!this.readyState ||
                            this.readyState === "loaded" || this.readyState === "complete") ) {
                        done = true;
                        script.onload = script.onreadystatechange = null;
                        if ( head && script.parentNode ) {
                            head.removeChild( script );
                        }
                        console.log("Done Load compiled classes ns=",ns,"url=",url,Tonyu.classes);
                        //same as projectCompiler (XXXX)
                        var cls=Tonyu.classes;
                        ns.split(".").forEach(function (c) {
                            if (cls) cls=cls[c];
                            // comment out : when empty concat.js
                            //if (!cls) throw new Error("namespace Not found :"+ns);
                        });
                        if (cls) {
                            for (var cln in cls) {
                                var cl=cls[cln];
                                var m=Tonyu.klass.getMeta(cl);
                                ctx.classes[m.fullName]=m;
                            }
                        }
                        //------------------XXXX
                        d.resolve();
                    }
                };
                head.insertBefore( script, head.firstChild );
                return d.promise();
            }
        }
    };
    return CPR;
});
define('ProjectCompiler',["Tonyu","Tonyu.Compiler.JSGenerator","Tonyu.Compiler.Semantics",
        "Tonyu.TraceTbl","FS","assert","SFile","DeferredUtil","compiledProject"],
        function (Tonyu,JSGenerator,Semantics,
                ttb,FS,A,SFile,DU,CPR) {
var TPRC=function (dir) {
     A(SFile.is(dir) && dir.isDir(), "projectCompiler: "+dir+" is not dir obj");
     var TPR={env:{}};
     var traceTbl=Tonyu.TraceTbl;//();
     var F=DU.throwF;
     TPR.env.traceTbl=traceTbl;
     TPR.EXT=".tonyu";
     TPR.getOptionsFile=function () {
         var resFile=dir.rel("options.json");
         return resFile;
     };
     TPR.getOptions=function () {
         var env=TPR.env;
         env.options={};
         var resFile=TPR.getOptionsFile();
         if (resFile.exists()) env.options=resFile.obj();
         TPR.fixOptions(env.options);
         return env.options;
     };
     TPR.setOptions=function (opt) {
         TPR.getOptionsFile().obj(opt);
     }; // ADDJSL
     TPR.fixOptions=function (opt) {
         if (!opt.compiler) opt.compiler={};
     };
     TPR.resolve=function (rdir){
         if (rdir instanceof Array) {
             var res=[];
             rdir.forEach(function (e) {
                 res.push(TPR.resolve(e));
             });
             return res;
         }
         if (typeof rdir=="string") {
             return FS.resolve(rdir, dir.path());
         }
         if (!rdir || !rdir.isDir) throw new Error("Cannot TPR.resolve: "+rdir);
         return rdir;
     };
     TPR.shouldCompile=function () {
         var outF=TPR.getOutputFile();
         if (!outF.exists()) {
             return true;
         }
         if (outF.isReadOnly()) return false;
         var outLast=outF.lastUpdate();
         if (outLast<Tonyu.VERSION) {
             console.log("Should compile: ", outF.name()+" last="+new Date(outLast)+" < Tonyu.ver="+new Date(Tonyu.VERSION));
             return true;
         }
         //console.log("Outf last="+new Date(outLast));
         var sf=TPR.sourceFiles(TPR.getNamespace());
         for (var i in sf) {
             var f=sf[i];
             var l=f.lastUpdate();
             if (l>outLast) {
                 console.log("Should compile: ", f.name()+" last="+new Date(l));
                 return true;
             }
         }
         var resFile=TPR.getOptionsFile();
         if (resFile.exists() && resFile.lastUpdate()>outLast) {
             console.log("Should compile: ", resFile.name()+" last="+new Date(resFile.lastUpdate()));
             return true;
         }
         return false;
     };
     TPR.getClassName=function (file) {//ADDJSL
         A(SFile.is(file));
         if (dir.contains(file)) {
             return TPR.getNamespace()+"."+file.truncExt(TPR.EXT);
         }
         var res;
         TPR.getDependingProjects().forEach(function (dp) {
             if (!res) res=dp.getClassName(file);
         });
         return res;
     };
     TPR.getNamespace=function () {
         var opt=TPR.getOptions();
         return A(opt.compiler.namespace,"namespace not specified opt="+JSON.stringify(opt));
     };
     TPR.getOutputFile=function (lang) {
         var opt=TPR.getOptions();
         var outF=TPR.resolve(A(opt.compiler.outputFile,"output file should be specified in options"));
         if (outF.isDir()) {
             throw new Error("out: directory style not supported");
         }
         return outF;
     };
     TPR.loadDependingClasses=function (ctx) {
         var task=DU.directPromise();
         var myNsp=TPR.getNamespace();
         TPR.getDependingProjects().forEach(function (p) {
             if (p.getNamespace()==myNsp) return;
             task=task.then(function () {
                 return p.loadClasses(ctx);
             });
         });
         return task;
     };
     // Difference of ctx and env:  env is of THIS project. ctx is of cross-project
     TPR.loadClasses=function (ctx/*or options(For external call)*/) {
         Tonyu.runMode=false;
         console.log("LoadClasses: "+dir.path());
         ctx=initCtx(ctx);
         var visited=ctx.visited||{};
         //var classes=ctx.classes||{};
         if (visited[TPR.path()]) return DU.directPromise();
         visited[TPR.path()]=true;
         /*TPR.getDependingProjects().forEach(function (p) {
             if (p.getNamespace()==myNsp) return;
             task=task.then(function () {
                 return p.loadClasses(ctx);
             });
         });*/
         return TPR.loadDependingClasses(ctx).then(function () {
             return TPR.shouldCompile();
         }).then(function (sc) {
             if (sc) {
                 return TPR.compile(ctx);
             } else {
                 var outF=TPR.getOutputFile("js");
                 return evalFile(outF).then(F(copyToClasses));
             }
         });
         function copyToClasses() {
             var ns=TPR.getNamespace();
            //same as compiledProject (XXXX)
             var cls=Tonyu.classes;
             ns.split(".").forEach(function (c) {
                 if (cls) cls=cls[c];
                 // comment out : when empty concat.js
                 //if (!cls) throw new Error("namespace Not found :"+ns);
             });
             if (cls) {
                 for (var cln in cls) {
                     var cl=cls[cln];
                     var m=Tonyu.klass.getMeta(cl);
                     ctx.classes[m.fullName]=m;
                 }
             }
             //------------------XXXX
         }
     };
     function initCtx(ctx) {
         var env=TPR.env;
         if (!ctx) ctx={};
         if (!ctx.visited) {
             ctx={visited:{}, classes:(env.classes=env.classes||{}),options:ctx};
         }
         return ctx;
     }
     TPR.compile=function (ctx/*or options(For external call)*/) {
         Tonyu.runMode=false;
         console.log("Compile: "+dir.path());
         ctx=initCtx(ctx);
         //var dp=TPR.getDependingProjects();
         var myNsp=TPR.getNamespace();
         /*var task=DU.directPromise();
         dp.forEach(function (dprj) {
             var nsp=dprj.getNamespace();
             if (nsp!=myNsp) {
                 task=task.then(F(function () {
                     dprj.loadClasses(ctx);
                 }));
             }
         });*/
         return TPR.loadDependingClasses(ctx).then(F(function () {
             var baseClasses=ctx.classes;
             console.log("baseClasses", baseClasses);
             var ctxOpt=ctx.options;
             var env=TPR.env;
             env.aliases={};
             env.classes=baseClasses;
             for (var n in baseClasses) {
                 var cl=baseClasses[n];
                 env.aliases[ cl.shortName] = cl.fullName;
             }
             var newClasses={};
             var sf=TPR.sourceFiles(myNsp);
             for (var shortCn in sf) {
                 var f=sf[shortCn];
                 var fullCn=myNsp+"."+shortCn;
                 newClasses[fullCn]=baseClasses[fullCn]={
                         fullName:  fullCn,
                         shortName: shortCn,
                         namespace: myNsp,
                         src:{
                             tonyu: f
                         }
                 };
                 env.aliases[shortCn]=fullCn;
             }
             for (var n in newClasses) {
                 console.log("initClassDecl: "+n);
                 Semantics.initClassDecls(newClasses[n], env);/*ENVC*/
             }
             var ord=orderByInheritance(newClasses);/*ENVC*/
             ord.forEach(function (c) {
                 console.log("annotate :"+c.fullName);
                 Semantics.annotate(c, env);
             });
             TPR.concatJS(ord);
         }));
     };
     TPR.concatJS=function (ord) {
         var env=TPR.env;
         var cbuf="";
         ord.forEach(function (c) {
             console.log("concatJS :"+c.fullName);
             JSGenerator.genJS(c, env);
             cbuf+=c.src.js+"\n";
         });
         var outf=TPR.getOutputFile();
         outf.text(cbuf);
         evalFile(outf);
     };
     TPR.getDependingProjects=function () {
         var opt=TPR.getOptions();
         var dp=opt.compiler.dependingProjects || [];
         return dp.map(function (dprj) {
             if (typeof dprj=="string") {
                 var prjDir=TPR.resolve(dprj);
                 return TPRC(prjDir);
             } else if (typeof dprj=="object") {
                 return CPR(dprj.namespace, FS.expandPath(dprj.compiledURL) );
             }
         });
     };
     TPR.dir=dir;
     TPR.path=function () {return dir.path();};
     TPR.sourceFiles=function (nsp) {// nsp==null => all
         //nsp=nsp || TPR.getNamespace();//DELJSL
         var dirs=TPR.sourceDirs(nsp);// ADDJSL
         var res={};
         for (var i=dirs.length-1; i>=0 ; i--) {
             dirs[i].recursive(collect);
         }
         function collect(f) {
             if (f.endsWith(TPR.EXT)) {
                 var nb=f.truncExt(TPR.EXT);
                 res[nb]=f;
             }
         }
         return res;
     };
     TPR.sourceDir=function () {
         return dir;
     };
     TPR.sourceDirs=function (myNsp) {//ADDJSL  myNsp==null => All
         var dp=TPR.getDependingProjects();
         //var myNsp||TPR.getNamespace();//DELJSL
         var dirs=[dir];
         dp.forEach(function (dprj) {
             var nsp=dprj.getNamespace();
             if (!myNsp || nsp==myNsp) {
                 var d=dprj.sourceDir();
                 if (d) dirs.push(d);
             }
         });
         return dirs;
     };
    function orderByInheritance(classes) {/*ENVC*/
        var added={};
        var res=[];
        var crumbs={};
        var ccnt=0;
        for (var n in classes) {/*ENVC*/
            added[n]=false;
            ccnt++;
        }
        while (res.length<ccnt) {
            var p=res.length;
            for (var n in classes) {/*ENVC*/
                if (added[n]) continue;
                var c=classes[n];/*ENVC*/
                var deps=dep1(c);
                //var ready=true;
                /*deps.forEach(function (cl) {
                    ready=ready && (
                       !cl || !classes[cl.fullName] || cl.builtin || added[cl.fullName]
                    );
                });*/
                if (deps.length==0) {
                    res.push(c);
                    added[n]=true;
                }
            }
            if (res.length==p) {
                var loop=[];
                for (var n in classes) {
                    if (!added[n]) {
                        loop=detectLoop(classes[n]) || [];
                        break;
                    }
                }
                throw TError( "次のクラス間に循環参照があります: "+loop.join("->"), "不明" ,0);
            }
        }
        function dep1(c) {
            var spc=c.superclass;
            var deps=spc ? [spc]:[] ;
            if (c.includes) deps=deps.concat(c.includes);
            deps=deps.filter(function (cl) {
                return cl && classes[cl.fullName] && !cl.builtin && !added[cl.fullName];
            });
            return deps;
        }
        function detectLoop(c, prev){
            //  A->B->C->A
            // c[B]=A  c[C]=B   c[A]=C
            console.log("detectloop",c.fullName);
            if (crumbs[c.fullName]) {   // c[A]
                console.log("Detected: ",c.fullName, crumbs, crumbs[c.fullName]);
                var n=c.fullName;
                var loop=[];
                do {
                    loop.unshift(n);    // A      C       B
                    n=crumbs[n];        // C      B       A
                } while(n!=c.fullName);
                loop.unshift(c.fullName);
                return loop;
            }
            if (prev) crumbs[c.fullName]=prev.fullName;
            var deps=dep1(c),res;
            deps.forEach(function (d) {
                if (res) return;
                var r=detectLoop(d,c);
                if (r) res=r;
            });
            delete crumbs[c.fullName];
            return res;
        }
        return res;
    }
    function evalFile(f) {
        console.log("loading: "+f.path());
        var lastEvaled=new Function(f.text());
        traceTbl.addSource(f.path(),lastEvaled+"");
        return DU.directPromise( lastEvaled() );
    }
    TPR.decodeTrace=function (desc) { // user.Test:123
        var a=desc.split(":");
        var cl=a[0],pos=parseInt(a[1]);
        var cls=cl.split(".");
        var sn=cls.pop();
        var nsp=cls.join(".");
        if (nsp==TPR.getNamespace()) {
            var sf=TPR.sourceFiles(nsp);
            for (var i in sf) {
                if (sn==i) {
                    return TError("Trace info", sf[i], pos);
                }
            }
        }
    };
    return TPR;
}
return TPRC;
});


define('NewProjectDialog',["UI"], function (UI) {
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
        	res.d=UI("div",{title:(options.ren?"プロジェクト名の変更":"新規プロジェクト")},
        			["div",
        			 ["span","プロジェクト名"],
        			 ["input",{$edit:"name",value:options.defName||"",
        			     on:{enterkey:function () {
                		     res.d.done();
				 }}}]],
         			["div",
        			 ["span","親フォルダ"],
        			 ["input",{$edit:{name:"parentDir",type:FType}}]],
        			 ["div",
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
        var model={name:options.defName||"", parentDir:prjDir};
        d.$edits.load(model);
    	d.$edits.validator.on.validate=function (model) {
    		if (model.name=="") {
    			this.addError("name","名前を入力してください");
    			return;
    		}
    		model.dstDir=model.parentDir.rel(model.name+"/");
            if (model.dstDir.exists()) {
                this.addError("name","このフォルダはすでに存在します");
                return;
            }
    		this.allOK();
    		d.$vars.dstDir.text(model.dstDir+"");
    	};
    	d.done=function () {
    	    if (d.$edits.validator.isValid()) {
                onOK(model.dstDir);
                d.dialog("close");
    	    }
    	};
    	return d;
    };
    return res;
});

define('Auth',[], function () {
    Auth={
            currentUser:function (r) {
                r();
            }
    };
    return Auth;
});
define('zip',["FS","Shell","Util"],function (FS,sh,Util) {
    if (typeof JSZip=="undefined") return {};
    var zip={};
    zip.zip=function (dir,options) {
        var zip = new JSZip();
        function loop(dst, dir) {
            dir.each(function (f) {
                if (f.isDir()) {
                    var sf=dst.folder(f.name());
                    loop(sf, f);
                } else {
                    dst.file(f.name(),f.text());
                }
            });
        }
        loop(zip, dir);
        //zip.file("Hello.txt", "Hello World\n");
        //var img = zip.folder("images");
        //img.file("smile.gif", imgData, {base64: true});
        var content = zip.generate({type:"blob"});
        return content;
    };
    if (typeof saveAs!="undefined") {
        sh.dlzip=function (dir) {
            dir=sh.resolve(dir);
            var content=zip.zip(dir);
            saveAs(content, dir.name().replace(/\//g,"")+".zip");
        }
    }
    // same as SFileNW.js
    var binMap={".png": "image/png", ".jpg":"image/jpg", ".gif": "image/gif", ".jpeg":"image/jpg",
            ".mp3":"audio/mp3", ".ogg":"audio/ogg"};
    zip.unzip=function (arrayBuf,destDir) {
        var zip=new JSZip(arrayBuf);
        for (var i in zip.files) {
            var zipEntry=zip.files[i];
            var dest=destDir.rel(zipEntry.name);
            for (var ext in binMap) {
                var text;
                if (dest.endsWith(ext)) {
                    var ct=binMap[ext];
                    text="data:"+ct+";base64,"+Util.Base64_From_ArrayBuffer(zipEntry.asArrayBuffer());
                } else {
                    text=zipEntry.asText();
                }
                dest.text(text);
            }
            console.log(zipEntry.name);
        }
    };
    return zip;
});
define('Sync',["FS","Shell",/*"requestFragment",*/"WebSite","SFile","assert"],
        function (FS,sh,/*rf,*/WebSite,SFile,A) {
    var Sync={};
    sh.sync=function () {
        // sync options:o      local=remote=cwd
        // sync dir:s|file options:o local=remote=dir
        // sync local:s|file remote:s|file options:o
        var local,remote,options,onend=function(){};
        var i=0;
        if (typeof arguments[i]=="string" || SFile.is(arguments[i])) {
            local=sh.resolve(arguments[i], true);
            i++;
            if (typeof arguments[i]=="string" || SFile.is(arguments[i])) {
                remote=sh.resolve(arguments[i], false);
                i++;
            }
        }
        if (typeof arguments[i]=="object") { options=arguments[i]; i++;}
        if (!local) remote=local=sh.cwd;
        if (!remote) remote=local;
        sh.echo("sync args=",local,remote,options);
        return Sync.sync(local,remote,options);
    };
    Sync.NOT_LOGGED_IN="Not logged in.";
    Sync.sync=function () {
        // sync dir:file options:o local=remote=dir
        // sync local:file remote:file options:o
        var local,remote,options;
        function getLocalDirInfo() {
            var res={};
            local.recursive(function (file) {
                var lcm=file.metaInfo();
                res[file.relPath(local)]=lcm;
            },{excludes:options.excludes});
            return res;
        }
        function unionKeys() {
            var keys={};
            for (var i=0 ; i<arguments.length ;i++) {
                for (var key in arguments[i]) {keys[key]=1;}
            }
            return keys;
        }
        function getDelta(before,after) {
            //console.log("getDelta",before,after);
            var keys=unionKeys(before,after);
            var res={};
            for (var key in keys) {
                var inb=(key in before),ina=(key in after);
                //console.log("Compare", before[key], after[key], ina, inb);
                if (inb && !ina) {
                    // DELETED
                    res[key]={lastUpdate:-1, trashed:true};
                } else if (!inb && ina) {
                    // CREATEDED
                    res[key]={lastUpdate:after[key].lastUpdate, created:true};
                } else if (before[key].lastUpdate != after[key].lastUpdate) {
                    // MODIFIED
                    res[key]={
                            lastUpdate: after[key].lastUpdate,
                            modified:true
                    };
                    //console.log("Added", key, before[key].lastUpdate , after[key].lastUpdate)
                }
            }
            return res;
        }
        function getDeltaDelta(local,remote) {
            var keys=unionKeys(local,remote);
            var res={local:{}, remote:{} };
            for (var key in keys) {
                var inl=(key in local),inr=(key in remote);
                if (inl && !inr) {
                    res.local[key]=local[key];
                } else if (!inl && inr) {
                    res.remote[key]=remote[key];
                } else if (local[key].lastUpdate > remote[key].lastUpdate) {
                    res.local[key]=local[key];
                } else {
                    res.remote[key]=remote[key];
                }
            }
            return res;
        }
        var i=0;
        if (SFile.is(arguments[i])) {
            local=arguments[i];
            i++;
            if (SFile.is(arguments[i])) {
                remote=arguments[i];
                i++;
            }
        }
        if (typeof arguments[i]=="object") { options=arguments[i]; i++;}
        if (!local) throw "Sync.sync: Local dir must be specified as file object";
        if (!remote) remote=local;
        if (!options) options={};
        if (options.test) options.v=1;
        var syncInfoDir=local.rel(".sync/");
        options.excludes=options.excludes||[];
        options.excludes=options.excludes.concat(syncInfoDir.name());
        var localDirInfoFile=syncInfoDir.rel("local.json");
        var remoteDirInfoFile=syncInfoDir.rel("remote.json");
        var lastLocalDirInfo=localDirInfoFile.exists()?localDirInfoFile.obj():{};
        var lastRemoteDirInfo=remoteDirInfoFile.exists()?remoteDirInfoFile.obj():{};
        var curLocalDirInfo=getLocalDirInfo();
        var localDelta=getDelta(lastLocalDirInfo, curLocalDirInfo);
        if (options.v) sh.echo("localDelta",localDelta);
        var uploads={},downloads=[],visited={};
        var user;
        function status(name, param) {
            sh.echo("Status: "+name+" param:",param);
            if (options.onstatus) {
                options.onstatus(name, param);
            }
        }
        function onError() {
            if (options.onerror) {
                options.onerror.apply(this, arguments);
            }
        }
        var req={base:remote.path(),excludes:JSON.stringify(options.excludes),token:""+Math.random()};
        status("getDirInfo", req);
        return $.ajax({
            type:"get",
            url:A(WebSite.url.getDirInfo),
            data:req
        }).then(function n1(curRemoteDirInfo) {
            var d;
            if (options.v) sh.echo("getDirInfo",curRemoteDirInfo);
            if (curRemoteDirInfo.NOT_LOGGED_IN) {
                d = new $.Deferred;
                setTimeout(function(){
                  d.reject(Sync.NOT_LOGGED_IN);
                }, 0);
                return d.promise();
            }
            user=curRemoteDirInfo.user;
            var base=local;//FS.get(curRemoteDirInfo.base);
            var remoteDelta=getDelta(lastRemoteDirInfo, curRemoteDirInfo.data);
            if (options.v) sh.echo("remoteDelta",remoteDelta);
            var dd=getDeltaDelta(localDelta,remoteDelta);
            var o,f,m;
            for (var key in dd.local) {
                 f=local.rel(key);
                 o={};
                 if (f.exists()) o.text=f.text();
                 m=dd.local[key];
                 for (var i in m) o[i]=m[i];
                 uploads[key]=o;
                 if (options.v)
                        sh.echo("Upload",key,m);
            }
            for (var key in dd.remote) {
                downloads.push(key);
                if (options.v)
                    sh.echo("Download",key,dd.remote[key]);
            }
            if (options.v) {
                sh.echo("uploads:",uploads);
                sh.echo("downloads:",downloads);
            }
            var req={base:remote.path(),paths:JSON.stringify(downloads),token:""+Math.random()};
            status("getFiles", req);
            return $.ajax({
                type:"post",
                url:A(WebSite.url.getFiles),
                data:req
            });
        }).then(function n2(dlData) {
            sh.echo("dlData=",dlData);
            //dlData=JSON.parse(dlData);
            if (options.v) sh.echo("dlData:",dlData);
            var base=local;//FS.get(dlData.base);
            if (options.test) return;
            for (var rel in dlData.data) {
                var dlf=base.rel(rel);
                var d=dlData.data[rel];
                //if (options.v) sh.echo(dlf.path(), d);
                if (d.trashed) {
                    if (dlf.exists()) dlf.rm();
                } else {
                    dlf.text(d.text);
                }
                delete d.text;
                dlf.metaInfo(d);
            }
            var req={base:remote.path(),data:JSON.stringify(uploads),token:""+Math.random()};
            req.pathInfo=A(WebSite.url.putFiles);
            status("putFiles", req);
            return $.ajax({  // TODO:requestFragment
                type:"post",
                url:req.pathInfo,
                data:req
            });
        }).then(function n3(res){
            var newRemoteDirInfo=res.data;
            if (options.v) sh.echo("putFiles res=",res);
            var newLocalDirInfo=getLocalDirInfo();
            localDirInfoFile.obj(newLocalDirInfo);
            remoteDirInfoFile.obj(newRemoteDirInfo);

            var upds=[];
            for (var i in uploads) upds.push(i);
            return res={msg:res,uploads:upds,downloads: downloads,user:user};
        });
    };
    sh.rsh=function () {
        var a=[];
        for (var i=0; i<arguments.length; i++) a[i]=arguments[i];
        return $.ajax({
            url:A(WebSite.url.rsh),
            data:{args:JSON.stringify(a)},
        });
    };
    return Sync;
});

requirejs(["FS","Shell","Shell2","ProjectCompiler",
           "NewProjectDialog","UI","Auth","zip","Sync"],
  function (FS, sh,sh2,TPRC,
           NPD,           UI, Auth,zip,Sync) {
$(function () {
    $("body").append(UI("div",
            ["h1","プロジェクト一覧"],
            ["button", {id:"newPrj", "class":"btn btn-primary"}, "新規プロジェクト"],
            ["span",{id:"syncMesg"}],
            ["div",{id:"prjItemList"}]
    ));
    var projects=FS.resolve("${tonyuHome}/Projects/");
    projects.mkdir();
    sh.cd(projects);
    var curDir=projects;
    function ls() {
        $("#prjItemList").empty();
        var d=[];
        curDir.each(function (f) {
            if (!f.isDir()) return;
            var l=f.lastUpdate();
            var r=f.rel("options.json");
            if (r.exists()) {
                l=r.lastUpdate();
            }
            d.push([f,l]);
        });
        d=d.sort(function (a,b) {
            return b[1]-a[1];
        });
        d.forEach(function (e) {
            var f=e[0];
            var name=f.name();

            if (!f.isDir()) return;
            if (!f.rel("options.json").exists()) return;
            var u=UI("div", {"class":"project"},
                    ["a", {href:"?r=jsl_edit&dir="+f.path()},
                     ["img",{$var:"t",src:FS.expandPath("${sampleImg}/tonyu.png")}],
                     ["div", name]],
                     ["div",
                      ["a",{on:{click:ren(f)}},"名前変更"], ["span"," "],
                      ["a",{on:{click:del(f)}},"削除"]]
                  );
            u.appendTo("#prjItemList");
            /*setTimeout(function () {
                var tn=f.rel("images/").rel("icon_thumbnail.png");
                //console.log(tn.path());
                if (tn.exists()) {
                    u.$vars.t.attr("src",tn.text());
                }
            },10);*/
        });
    }
    /*Auth.currentUser(function (r){
        if (r) {
            $(".while-logged-out").hide();
            $("#login").text(r);
        } else {
            $(".while-logged-in").hide();
        }
    });*/
    function ren(f) {
        return function () {
            NPD.show(projects, function (prjDir) {
                prjDir.moveFrom(f);
                ls();
            },{ren:true, defName:f.name().replace("/","")});
        };
    }
    function del(f) {
        return function () {
            if (confirm(f+"を削除しますか？")) {
                f.rm({r:true});
                ls();
            }
        };
    }
    if (!WebSite.isNW) {
        $("#syncMesg").text("同期しています....");
        Sync.sync(projects, FS.get("/"),{v:true}).then(function (e) {
            $("#syncMesg").append("完了");
            ls();
            setTimeout(function () {
                $("#syncMesg").text(e.user+"でログインしています。");
                $("#syncMesg").append(UI("a",{href:"login.php"},"他ユーザでログイン"));
            },1000);
        }).fail(function (e) {
            if (e==Sync.NOT_LOGGED_IN) {
                $("#syncMesg").empty().append(UI("a",{href:"login.php"},"ログイン"));
            } else {
                $("#syncMesg").text("エラー!"+e);
                console.log(e);
            }
        });
    }
    $("#newPrj").click(function (){
    	NPD.show(projects, function (prjDir) {
            prjDir.mkdir();
            TPRC(prjDir).setOptions({
                compiler:{
                    namespace:"user",
                    outputFile:"js/concat.js",
                    defaultSuperClass:"jslker.Parent",
                    dependingProjects:[
                         {"namespace":"jslker", "compiledURL":"${JSLKer}/js/concat.js"}
                    ]
                }
            });
            document.location.href="?r=jsl_edit&dir="+prjDir.path();
    	});
    });
    ls();
});
});

define("jsl_selProject", function(){});

